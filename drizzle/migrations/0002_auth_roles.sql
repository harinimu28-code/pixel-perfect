CREATE TYPE public.app_role AS ENUM ('admin','art_director','design','props','lighting','modeling','animation');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('stagesync_first_admin'));
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), COALESCE(NEW.email, ''));
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profiles read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_any_role(auth.uid()));
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "roles read own or admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND user_id <> auth.uid());

-- Workspace data: only signed-in users with an assigned role
DROP POLICY "shared workspace access" ON public.projects;
DROP POLICY "shared workspace access" ON public.stage_objects;
DROP POLICY "shared workspace access" ON public.timeline_events;
DROP POLICY "shared workspace access" ON public.requirements;
DROP POLICY "shared workspace access" ON public.comments;
DROP POLICY "shared workspace access" ON public.asset_library;
REVOKE ALL ON public.projects, public.stage_objects, public.timeline_events, public.requirements, public.comments, public.asset_library FROM anon;

CREATE POLICY "team access" ON public.projects FOR ALL TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "team access" ON public.stage_objects FOR ALL TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "team access" ON public.timeline_events FOR ALL TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "team access" ON public.requirements FOR ALL TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "team access" ON public.comments FOR ALL TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "team read" ON public.asset_library FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "team insert" ON public.asset_library FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "team update" ON public.asset_library FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "leads delete" ON public.asset_library FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'art_director') OR public.has_role(auth.uid(), 'modeling'));

DROP POLICY "stage assets read" ON storage.objects;
DROP POLICY "stage assets upload" ON storage.objects;
DROP POLICY "stage assets delete" ON storage.objects;
CREATE POLICY "stage assets read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'stage-assets' AND public.has_any_role(auth.uid()));
CREATE POLICY "stage assets upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stage-assets' AND public.has_any_role(auth.uid()) AND lower(storage.extension(name)) IN ('glb','gltf','obj'));
CREATE POLICY "stage assets delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'stage-assets' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'art_director') OR public.has_role(auth.uid(), 'modeling')));
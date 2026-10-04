CREATE TABLE public.projects (
  id text PRIMARY KEY,
  name text NOT NULL,
  stage_width double precision NOT NULL DEFAULT 12,
  stage_depth double precision NOT NULL DEFAULT 8,
  stage_height double precision NOT NULL DEFAULT 0.6,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.stage_objects (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  asset_type text NOT NULL,
  department text NOT NULL,
  position_x double precision NOT NULL DEFAULT 0,
  position_y double precision NOT NULL DEFAULT 0,
  position_z double precision NOT NULL DEFAULT 0,
  rotation_x double precision NOT NULL DEFAULT 0,
  rotation_y double precision NOT NULL DEFAULT 0,
  rotation_z double precision NOT NULL DEFAULT 0,
  scale_x double precision NOT NULL DEFAULT 1,
  scale_y double precision NOT NULL DEFAULT 1,
  scale_z double precision NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'Draft',
  owner text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.timeline_events (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  event_time double precision NOT NULL DEFAULT 0,
  end_time double precision NOT NULL DEFAULT 0,
  department text NOT NULL,
  action text NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.requirements (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  department text NOT NULL,
  owner text,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  due_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.comments (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  object_id text REFERENCES public.stage_objects(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'You',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.stage_objects(project_id);
CREATE INDEX ON public.timeline_events(project_id);
CREATE INDEX ON public.requirements(project_id);
CREATE INDEX ON public.comments(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects, public.stage_objects, public.timeline_events, public.requirements, public.comments TO anon, authenticated;
GRANT ALL ON public.projects, public.stage_objects, public.timeline_events, public.requirements, public.comments TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- No sign-in yet: the planner is a shared workspace. Replace with team-scoped policies when logins are added.
CREATE POLICY "shared workspace access" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared workspace access" ON public.stage_objects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared workspace access" ON public.timeline_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared workspace access" ON public.requirements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared workspace access" ON public.comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
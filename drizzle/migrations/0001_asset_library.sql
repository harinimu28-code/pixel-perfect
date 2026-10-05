CREATE TABLE public.asset_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  original_filename text NOT NULL,
  storage_path text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  category text NOT NULL DEFAULT 'Custom',
  department text NOT NULL DEFAULT 'Design',
  size_bytes bigint NOT NULL DEFAULT 0,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_library TO anon, authenticated;
GRANT ALL ON public.asset_library TO service_role;
ALTER TABLE public.asset_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared workspace access" ON public.asset_library FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.stage_objects ADD COLUMN asset_id uuid REFERENCES public.asset_library(id) ON DELETE SET NULL;
CREATE INDEX ON public.stage_objects(asset_id);

CREATE POLICY "stage assets read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'stage-assets');
CREATE POLICY "stage assets upload" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'stage-assets' AND lower(storage.extension(name)) IN ('glb','gltf','obj'));
CREATE POLICY "stage assets delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'stage-assets');
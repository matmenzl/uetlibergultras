-- Tabelle für hochgeladene Runs
CREATE TABLE public.manual_run_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filename text NOT NULL,
  format text NOT NULL,
  started_at timestamptz,
  distance_m double precision,
  elapsed_s integer,
  trackpoint_count integer,
  segments_matched integer NOT NULL DEFAULT 0,
  check_ins_created integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_run_uploads TO authenticated;
GRANT ALL ON public.manual_run_uploads TO service_role;

ALTER TABLE public.manual_run_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uploads"
  ON public.manual_run_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
  ON public.manual_run_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all uploads"
  ON public.manual_run_uploads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_manual_run_uploads_updated_at
  BEFORE UPDATE ON public.manual_run_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- check_ins um Source-Tracking erweitern
ALTER TABLE public.check_ins
  ADD COLUMN source text NOT NULL DEFAULT 'strava',
  ADD COLUMN upload_id uuid REFERENCES public.manual_run_uploads(id) ON DELETE SET NULL;

CREATE INDEX idx_check_ins_upload_id ON public.check_ins(upload_id) WHERE upload_id IS NOT NULL;
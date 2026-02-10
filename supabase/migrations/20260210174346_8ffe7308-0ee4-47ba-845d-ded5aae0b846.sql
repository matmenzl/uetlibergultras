
-- Create monthly_challenge_winners table
CREATE TABLE public.monthly_challenge_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  rank integer NOT NULL,
  total_runs integer NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(year, month, rank)
);

-- Enable RLS
ALTER TABLE public.monthly_challenge_winners ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all entries (for display)
CREATE POLICY "Authenticated users can view monthly challenge winners"
ON public.monthly_challenge_winners
FOR SELECT
TO authenticated
USING (true);

-- No INSERT/UPDATE/DELETE for normal users - only service role (edge functions)

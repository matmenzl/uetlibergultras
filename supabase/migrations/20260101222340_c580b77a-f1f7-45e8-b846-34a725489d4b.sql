-- Create table for achievement suggestions
CREATE TABLE public.achievement_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  how_to_earn TEXT NOT NULL,
  status public.suggestion_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.achievement_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suggestions
CREATE POLICY "Users can view their own achievement suggestions"
ON public.achievement_suggestions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own suggestions
CREATE POLICY "Users can insert their own achievement suggestions"
ON public.achievement_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all achievement suggestions"
ON public.achievement_suggestions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update suggestions
CREATE POLICY "Admins can update achievement suggestions"
ON public.achievement_suggestions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete suggestions
CREATE POLICY "Admins can delete achievement suggestions"
ON public.achievement_suggestions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
-- Create enum for suggestion status
CREATE TYPE public.suggestion_status AS ENUM ('pending', 'approved', 'rejected');

-- Create segment_suggestions table
CREATE TABLE public.segment_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_segment_url TEXT NOT NULL,
  status suggestion_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.segment_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
ON public.segment_suggestions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own suggestions
CREATE POLICY "Users can insert their own suggestions"
ON public.segment_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
ON public.segment_suggestions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update suggestions (approve/reject)
CREATE POLICY "Admins can update suggestions"
ON public.segment_suggestions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete suggestions
CREATE POLICY "Admins can delete suggestions"
ON public.segment_suggestions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
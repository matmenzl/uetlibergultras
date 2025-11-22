-- Create kudos table
CREATE TABLE public.kudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  effort_id UUID NOT NULL REFERENCES public.segment_efforts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(effort_id, user_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  effort_id UUID NOT NULL REFERENCES public.segment_efforts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on kudos
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kudos
CREATE POLICY "Everyone can view kudos"
ON public.kudos
FOR SELECT
USING (true);

CREATE POLICY "Users can add kudos"
ON public.kudos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own kudos"
ON public.kudos
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Everyone can view comments"
ON public.comments
FOR SELECT
USING (true);

CREATE POLICY "Users can add comments"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_kudos_effort_id ON public.kudos(effort_id);
CREATE INDEX idx_kudos_user_id ON public.kudos(user_id);
CREATE INDEX idx_comments_effort_id ON public.comments(effort_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Enable realtime for kudos and comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.kudos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
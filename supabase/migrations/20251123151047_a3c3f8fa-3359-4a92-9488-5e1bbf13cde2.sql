-- Add length constraint to comments table for security
ALTER TABLE public.comments 
ADD CONSTRAINT comment_text_length 
CHECK (length(comment_text) BETWEEN 2 AND 1000);

-- Add index for better performance on comment queries
CREATE INDEX IF NOT EXISTS idx_comments_effort_id_created_at 
ON public.comments(effort_id, created_at DESC);

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT comment_text_length ON public.comments IS 
'Ensures comment text is between 2 and 1000 characters to prevent abuse and maintain data quality';
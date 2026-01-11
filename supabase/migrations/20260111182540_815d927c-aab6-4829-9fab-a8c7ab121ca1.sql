-- Remove overly permissive INSERT/UPDATE/DELETE policies for webcam-screenshots bucket
-- The edge function uses service role key, which bypasses RLS anyway
-- Only keep public READ access

DROP POLICY IF EXISTS "Allow insert webcam screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow update webcam screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete webcam screenshots" ON storage.objects;

-- Optionally: If admins need manual access, add admin-only policies
CREATE POLICY "Admins can manage webcam screenshots"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'webcam-screenshots' 
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'webcam-screenshots' 
  AND public.has_role(auth.uid(), 'admin')
);
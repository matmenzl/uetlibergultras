-- Create storage bucket for webcam screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('webcam-screenshots', 'webcam-screenshots', true);

-- Allow public read access for webcam screenshots
CREATE POLICY "Public read access for webcam screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'webcam-screenshots');

-- Allow anyone to insert webcam screenshots (for edge function with service role)
CREATE POLICY "Allow insert webcam screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'webcam-screenshots');

-- Allow anyone to update webcam screenshots (for edge function with service role)
CREATE POLICY "Allow update webcam screenshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'webcam-screenshots');

-- Allow anyone to delete webcam screenshots (for edge function with service role)
CREATE POLICY "Allow delete webcam screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'webcam-screenshots');
-- Allow users to update their own manual check-ins
CREATE POLICY "Users can update their own manual check-ins"
ON public.check_ins
FOR UPDATE
USING (auth.uid() = user_id AND is_manual = true)
WITH CHECK (auth.uid() = user_id AND is_manual = true);

-- Allow users to delete their own manual check-ins
CREATE POLICY "Users can delete their own manual check-ins"
ON public.check_ins
FOR DELETE
USING (auth.uid() = user_id AND is_manual = true);
-- Add new Pioneer achievements to the enum type
ALTER TYPE public.achievement_type ADD VALUE IF NOT EXISTS 'pioneer_10';
ALTER TYPE public.achievement_type ADD VALUE IF NOT EXISTS 'pioneer_25';
ALTER TYPE public.achievement_type ADD VALUE IF NOT EXISTS 'pioneer_50';
ALTER TYPE public.achievement_type ADD VALUE IF NOT EXISTS 'founding_member';

-- Add is_founding_member flag to profiles table to track early adopters
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_founding_member boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_number integer;

-- Update existing users to be founding members and assign user numbers
UPDATE public.profiles SET is_founding_member = true, user_number = 1 WHERE user_number IS NULL;

-- Create a trigger to assign user_number on new profile creation
CREATE OR REPLACE FUNCTION public.assign_user_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(user_number), 0) + 1 INTO NEW.user_number FROM public.profiles;
  -- First 50 users are founding members
  IF NEW.user_number <= 50 THEN
    NEW.is_founding_member := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_profile_created_assign_number ON public.profiles;
CREATE TRIGGER on_profile_created_assign_number
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_user_number();
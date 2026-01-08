-- Add is_manual column to check_ins table
ALTER TABLE public.check_ins ADD COLUMN is_manual boolean DEFAULT false;

-- Add alternativliga to achievement_type enum
ALTER TYPE public.achievement_type ADD VALUE 'alternativliga';
-- Add weather columns to check_ins table
ALTER TABLE public.check_ins 
ADD COLUMN weather_code integer,
ADD COLUMN temperature decimal(5,2);

-- Add new achievement types for weather achievements
ALTER TYPE public.achievement_type ADD VALUE 'snow_bunny';
ALTER TYPE public.achievement_type ADD VALUE 'frosty';
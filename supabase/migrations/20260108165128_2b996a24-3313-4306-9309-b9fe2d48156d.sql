-- Add elevation_gain column for manual check-ins
ALTER TABLE public.check_ins 
ADD COLUMN elevation_gain integer NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.check_ins.elevation_gain IS 'Elevation gain in meters, used for manual check-ins';
-- Make elevation fields nullable to handle Strava API returning null values
ALTER TABLE public.uetliberg_segments 
  ALTER COLUMN elevation_high DROP NOT NULL,
  ALTER COLUMN elevation_low DROP NOT NULL;
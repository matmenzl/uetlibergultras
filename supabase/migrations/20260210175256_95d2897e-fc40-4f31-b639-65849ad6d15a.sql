
-- Add monthly challenge achievement types to enum
ALTER TYPE public.achievement_type ADD VALUE IF NOT EXISTS 'monthly_gold';
ALTER TYPE public.achievement_type ADD VALUE IF NOT EXISTS 'monthly_silver';
ALTER TYPE public.achievement_type ADD VALUE IF NOT EXISTS 'monthly_bronze';

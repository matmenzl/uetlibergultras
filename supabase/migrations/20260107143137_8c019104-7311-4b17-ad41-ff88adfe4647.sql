-- Add columns to track initial sync status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS initial_sync_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS initial_sync_started_at timestamptz,
ADD COLUMN IF NOT EXISTS initial_sync_months_done integer DEFAULT 0;
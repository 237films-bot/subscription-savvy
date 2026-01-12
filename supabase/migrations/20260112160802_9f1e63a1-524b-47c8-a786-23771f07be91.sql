-- Add column to disable credit tracking for subscriptions where it's not relevant
ALTER TABLE public.subscriptions 
ADD COLUMN credits_tracking_disabled BOOLEAN DEFAULT false;
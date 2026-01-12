-- Add position column for ordering subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN position INTEGER DEFAULT 0;
-- Add new columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'IA',
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS renewal_month INTEGER,
ADD COLUMN IF NOT EXISTS trial_end_date DATE;

-- Add constraint for billing_cycle
ALTER TABLE public.subscriptions 
ADD CONSTRAINT billing_cycle_check CHECK (billing_cycle IN ('monthly', 'annual'));

-- Add constraint for renewal_month (1-12)
ALTER TABLE public.subscriptions 
ADD CONSTRAINT renewal_month_check CHECK (renewal_month >= 1 AND renewal_month <= 12);

-- Create credit history table for tracking usage over time
CREATE TABLE public.credit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  credits_used INTEGER NOT NULL,
  credits_total INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_history
CREATE POLICY "Users can view their own credit history" 
ON public.credit_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit history" 
ON public.credit_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
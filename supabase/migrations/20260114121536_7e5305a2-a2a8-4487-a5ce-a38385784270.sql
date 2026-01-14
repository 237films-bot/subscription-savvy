-- Drop existing restrictive RLS policies on subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.subscriptions;

-- Create permissive policies for passphrase-protected app
CREATE POLICY "Allow all select on subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all insert on subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all update on subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all delete on subscriptions" 
ON public.subscriptions 
FOR DELETE 
USING (true);

-- Drop existing restrictive RLS policies on credit_history
DROP POLICY IF EXISTS "Users can view their own credit history" ON public.credit_history;
DROP POLICY IF EXISTS "Users can insert their own credit history" ON public.credit_history;

-- Create permissive policies for credit_history
CREATE POLICY "Allow all select on credit_history" 
ON public.credit_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all insert on credit_history" 
ON public.credit_history 
FOR INSERT 
WITH CHECK (true);
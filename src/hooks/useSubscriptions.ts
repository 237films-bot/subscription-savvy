import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Subscription, BillingCycle, SubscriptionCategory } from '@/types/subscription';

export type { Subscription };

export function useSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAndResetCredits = async (subscription: Subscription) => {
    const today = new Date();
    const lastReset = subscription.last_reset_date ? new Date(subscription.last_reset_date) : null;
    const renewalDay = subscription.renewal_day;
    const billingCycle = subscription.billing_cycle || 'monthly';
    const renewalMonth = subscription.renewal_month;
    
    let lastRenewalDate: Date;
    
    if (billingCycle === 'annual' && renewalMonth) {
      // Annual: specific day and month
      const monthIndex = renewalMonth - 1;
      lastRenewalDate = new Date(today.getFullYear(), monthIndex, renewalDay);
      if (lastRenewalDate > today) {
        lastRenewalDate = new Date(today.getFullYear() - 1, monthIndex, renewalDay);
      }
    } else {
      // Monthly
      lastRenewalDate = new Date(today.getFullYear(), today.getMonth(), renewalDay);
      if (lastRenewalDate > today) {
        lastRenewalDate.setMonth(lastRenewalDate.getMonth() - 1);
      }
    }
    
    // Check if we need to reset (last reset was before the last renewal date)
    const needsReset = !lastReset || lastReset < lastRenewalDate;
    
    if (needsReset && today >= lastRenewalDate) {
      // Record credit history before resetting
      const creditsUsed = subscription.credits_total - subscription.credits_remaining;
      if (creditsUsed > 0 || subscription.credits_remaining !== subscription.credits_total) {
        await supabase
          .from('credit_history')
          .insert({
            subscription_id: subscription.id,
            user_id: user?.id,
            credits_used: creditsUsed,
            credits_total: subscription.credits_total,
          });
      }
      
      const todayStr = today.toISOString().split('T')[0];
      await supabase
        .from('subscriptions')
        .update({ 
          credits_remaining: subscription.credits_total,
          last_reset_date: todayStr
        })
        .eq('id', subscription.id);
      
      return { ...subscription, credits_remaining: subscription.credits_total, last_reset_date: todayStr };
    }
    
    return subscription;
  };

  const fetchSubscriptions = async () => {
    if (!user) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      setLoading(false);
      return;
    }

    // Check and reset credits for each subscription
    const updatedSubscriptions = await Promise.all(
      (data || []).map(sub => checkAndResetCredits(sub as Subscription))
    );
    
    setSubscriptions(updatedSubscriptions);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    const { error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating subscription:', error);
    } else {
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub))
      );
    }
  };

  const addSubscription = async (subscription: Omit<Subscription, 'id'>) => {
    if (!user) return;

    // Get max position
    const maxPosition = subscriptions.length > 0 
      ? Math.max(...subscriptions.map(s => s.position || 0)) + 1 
      : 0;

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        ...subscription,
        user_id: user.id,
        position: maxPosition,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding subscription:', error);
    } else if (data) {
      setSubscriptions((prev) => [...prev, data as Subscription]);
    }
  };

  const reorderSubscriptions = async (activeId: string, overId: string) => {
    const oldIndex = subscriptions.findIndex(s => s.id === activeId);
    const newIndex = subscriptions.findIndex(s => s.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newSubscriptions = [...subscriptions];
    const [removed] = newSubscriptions.splice(oldIndex, 1);
    newSubscriptions.splice(newIndex, 0, removed);

    // Update positions
    const updates = newSubscriptions.map((sub, index) => ({
      id: sub.id,
      position: index,
    }));

    // Optimistic update
    setSubscriptions(newSubscriptions.map((sub, index) => ({ ...sub, position: index })));

    // Update in database
    for (const update of updates) {
      await supabase
        .from('subscriptions')
        .update({ position: update.position })
        .eq('id', update.id);
    }
  };

  const deleteSubscription = async (id: string) => {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subscription:', error);
    } else {
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    }
  };

  return { subscriptions, loading, updateSubscription, addSubscription, deleteSubscription, reorderSubscriptions, refetch: fetchSubscriptions };
}

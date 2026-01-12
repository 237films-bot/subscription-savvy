import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Subscription {
  id: string;
  name: string;
  icon: string;
  renewal_day: number;
  price: number;
  credits_total: number;
  credits_remaining: number;
  currency: string;
}

export function useSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    if (!user) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching subscriptions:', error);
    } else {
      setSubscriptions(data || []);
    }
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

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        ...subscription,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding subscription:', error);
    } else if (data) {
      setSubscriptions((prev) => [...prev, data]);
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

  return { subscriptions, loading, updateSubscription, addSubscription, deleteSubscription, refetch: fetchSubscriptions };
}

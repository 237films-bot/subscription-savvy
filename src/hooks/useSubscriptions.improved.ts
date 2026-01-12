/**
 * Enhanced useSubscriptions hook with React-Query for better caching and error handling
 * Replaces the original hook with improved state management
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { Subscription } from '@/types/subscription';
import { createSubscriptionSchema, updateSubscriptionSchema } from '@/schemas/subscription.schema';
import { useTranslation } from 'react-i18next';

const SUBSCRIPTIONS_KEY = 'subscriptions';

/**
 * Checks if a subscription's credits need to be reset based on renewal date
 * Records credit history before resetting
 */
async function checkAndResetCredits(
  subscription: Subscription,
  userId?: string
): Promise<Subscription> {
  const today = new Date();
  const lastReset = subscription.last_reset_date ? new Date(subscription.last_reset_date) : null;
  const renewalDay = subscription.renewal_day;
  const billingCycle = subscription.billing_cycle || 'monthly';
  const renewalMonth = subscription.renewal_month;

  let lastRenewalDate: Date;

  if (billingCycle === 'annual' && renewalMonth) {
    const monthIndex = renewalMonth - 1;
    lastRenewalDate = new Date(today.getFullYear(), monthIndex, renewalDay);
    if (lastRenewalDate > today) {
      lastRenewalDate = new Date(today.getFullYear() - 1, monthIndex, renewalDay);
    }
  } else {
    lastRenewalDate = new Date(today.getFullYear(), today.getMonth(), renewalDay);
    if (lastRenewalDate > today) {
      lastRenewalDate.setMonth(lastRenewalDate.getMonth() - 1);
    }
  }

  const needsReset = !lastReset || lastReset < lastRenewalDate;

  if (needsReset && today >= lastRenewalDate) {
    const creditsUsed = subscription.credits_total - subscription.credits_remaining;

    // Record credit history before resetting
    if (creditsUsed > 0 || subscription.credits_remaining !== subscription.credits_total) {
      await supabase.from('credit_history').insert({
        subscription_id: subscription.id,
        user_id: userId,
        credits_used: creditsUsed,
        credits_total: subscription.credits_total,
      });
    }

    const todayStr = today.toISOString().split('T')[0];
    const { error } = await supabase
      .from('subscriptions')
      .update({
        credits_remaining: subscription.credits_total,
        last_reset_date: todayStr,
      })
      .eq('id', subscription.id);

    if (error) throw error;

    return {
      ...subscription,
      credits_remaining: subscription.credits_total,
      last_reset_date: todayStr,
    };
  }

  return subscription;
}

/**
 * Fetches all subscriptions for the current user and auto-resets credits if needed
 */
async function fetchSubscriptions(userId?: string): Promise<Subscription[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Check and reset credits for each subscription
  const updatedSubscriptions = await Promise.all(
    (data || []).map((sub) => checkAndResetCredits(sub as Subscription, userId))
  );

  return updatedSubscriptions;
}

export function useSubscriptions() {
  const { user } = useAuth();
  const { handleError, handleSuccess } = useErrorHandler();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch subscriptions with React-Query caching
  const {
    data: subscriptions = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: [SUBSCRIPTIONS_KEY, user?.id],
    queryFn: () => fetchSubscriptions(user?.id),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes (renamed from cacheTime in v5)
    refetchOnWindowFocus: true,
  });

  // Handle query errors
  if (error) {
    handleError(error, t('errors.failedToLoad'));
  }

  // Add subscription mutation
  const addMutation = useMutation({
    mutationFn: async (subscription: Omit<Subscription, 'id'>) => {
      if (!user) throw new Error('User not authenticated');

      // Validate input
      const validated = createSubscriptionSchema.parse(subscription);

      // Get max position
      const maxPosition =
        subscriptions.length > 0
          ? Math.max(...subscriptions.map((s) => s.position || 0)) + 1
          : 0;

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          ...validated,
          user_id: user.id,
          position: maxPosition,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Subscription[]>([SUBSCRIPTIONS_KEY, user?.id], (old = []) => [
        ...old,
        data,
      ]);
      handleSuccess(t('success.subscriptionAdded'));
    },
    onError: (error) => {
      handleError(error, t('errors.failedToSave'));
    },
  });

  // Update subscription mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Subscription> }) => {
      // Validate input
      const validated = updateSubscriptionSchema.partial().parse({ ...updates, id });

      const { error } = await supabase
        .from('subscriptions')
        .update(validated)
        .eq('id', id);

      if (error) throw error;
      return { id, updates: validated };
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [SUBSCRIPTIONS_KEY, user?.id] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<Subscription[]>([SUBSCRIPTIONS_KEY, user?.id]);

      // Optimistically update
      queryClient.setQueryData<Subscription[]>([SUBSCRIPTIONS_KEY, user?.id], (old = []) =>
        old.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub))
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData([SUBSCRIPTIONS_KEY, user?.id], context.previous);
      }
      handleError(error, t('errors.failedToSave'));
    },
    onSuccess: () => {
      handleSuccess(t('success.subscriptionUpdated'));
    },
  });

  // Delete subscription mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subscriptions').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [SUBSCRIPTIONS_KEY, user?.id] });
      const previous = queryClient.getQueryData<Subscription[]>([SUBSCRIPTIONS_KEY, user?.id]);

      queryClient.setQueryData<Subscription[]>([SUBSCRIPTIONS_KEY, user?.id], (old = []) =>
        old.filter((sub) => sub.id !== id)
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([SUBSCRIPTIONS_KEY, user?.id], context.previous);
      }
      handleError(error, t('errors.failedToDelete'));
    },
    onSuccess: () => {
      handleSuccess(t('success.subscriptionDeleted'));
    },
  });

  // Reorder subscriptions mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ activeId, overId }: { activeId: string; overId: string }) => {
      const oldIndex = subscriptions.findIndex((s) => s.id === activeId);
      const newIndex = subscriptions.findIndex((s) => s.id === overId);

      if (oldIndex === -1 || newIndex === -1) throw new Error('Invalid indices');

      const newSubscriptions = [...subscriptions];
      const [removed] = newSubscriptions.splice(oldIndex, 1);
      newSubscriptions.splice(newIndex, 0, removed);

      // Update positions in database
      const updates = newSubscriptions.map((sub, index) => ({
        id: sub.id,
        position: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }

      return newSubscriptions.map((sub, index) => ({ ...sub, position: index }));
    },
    onMutate: async ({ activeId, overId }) => {
      await queryClient.cancelQueries({ queryKey: [SUBSCRIPTIONS_KEY, user?.id] });
      const previous = queryClient.getQueryData<Subscription[]>([SUBSCRIPTIONS_KEY, user?.id]);

      const oldIndex = subscriptions.findIndex((s) => s.id === activeId);
      const newIndex = subscriptions.findIndex((s) => s.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSubscriptions = [...subscriptions];
        const [removed] = newSubscriptions.splice(oldIndex, 1);
        newSubscriptions.splice(newIndex, 0, removed);

        queryClient.setQueryData<Subscription[]>(
          [SUBSCRIPTIONS_KEY, user?.id],
          newSubscriptions.map((sub, index) => ({ ...sub, position: index }))
        );
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([SUBSCRIPTIONS_KEY, user?.id], context.previous);
      }
      handleError(error, t('errors.failedToSave'));
    },
  });

  return {
    subscriptions,
    loading,
    updateSubscription: (id: string, updates: Partial<Subscription>) =>
      updateMutation.mutate({ id, updates }),
    addSubscription: (subscription: Omit<Subscription, 'id'>) =>
      addMutation.mutate(subscription),
    deleteSubscription: (id: string) => deleteMutation.mutate(id),
    reorderSubscriptions: (activeId: string, overId: string) =>
      reorderMutation.mutate({ activeId, overId }),
    refetch,
  };
}

export type { Subscription };

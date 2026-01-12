import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CreditHistoryEntry {
  id: string;
  subscription_id: string;
  credits_used: number;
  credits_total: number;
  recorded_at: string;
}

export interface MonthlyUsage {
  month: string;
  used: number;
  total: number;
  percentage: number;
}

export function useCreditHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<CreditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('credit_history')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: true });

    if (error) {
      console.error('Error fetching credit history:', error);
    } else {
      setHistory(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const recordUsage = async (subscriptionId: string, creditsUsed: number, creditsTotal: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('credit_history')
      .insert({
        subscription_id: subscriptionId,
        user_id: user.id,
        credits_used: creditsUsed,
        credits_total: creditsTotal,
      });

    if (error) {
      console.error('Error recording credit history:', error);
    } else {
      fetchHistory();
    }
  };

  // Aggregate by month (global)
  const getMonthlyUsage = (): MonthlyUsage[] => {
    const monthlyData = new Map<string, { used: number; total: number }>();

    history.forEach((entry) => {
      const date = new Date(entry.recorded_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyData.get(monthKey) || { used: 0, total: 0 };
      monthlyData.set(monthKey, {
        used: existing.used + entry.credits_used,
        total: existing.total + entry.credits_total,
      });
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        used: data.used,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.used / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  // Aggregate by month per subscription
  const getMonthlyUsageBySubscription = (): Map<string, MonthlyUsage[]> => {
    const subscriptionData = new Map<string, Map<string, { used: number; total: number }>>();

    history.forEach((entry) => {
      const date = new Date(entry.recorded_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!subscriptionData.has(entry.subscription_id)) {
        subscriptionData.set(entry.subscription_id, new Map());
      }
      
      const subMonthly = subscriptionData.get(entry.subscription_id)!;
      const existing = subMonthly.get(monthKey) || { used: 0, total: 0 };
      subMonthly.set(monthKey, {
        used: existing.used + entry.credits_used,
        total: existing.total + entry.credits_total,
      });
    });

    const result = new Map<string, MonthlyUsage[]>();
    
    subscriptionData.forEach((monthlyMap, subscriptionId) => {
      const monthlyArray = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          used: data.used,
          total: data.total,
          percentage: data.total > 0 ? Math.round((data.used / data.total) * 100) : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      result.set(subscriptionId, monthlyArray);
    });

    return result;
  };

  return { history, loading, recordUsage, getMonthlyUsage, getMonthlyUsageBySubscription, refetch: fetchHistory };
}

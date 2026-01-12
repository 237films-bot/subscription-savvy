import { useState, useEffect } from 'react';
import { Subscription } from '@/types/subscription';

const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    name: 'ChatGPT Plus',
    icon: '🤖',
    renewalDay: 15,
    price: 20,
    creditsTotal: 100,
    creditsRemaining: 45,
    currency: '€',
  },
  {
    id: '2',
    name: 'Lovable',
    icon: '💜',
    renewalDay: 8,
    price: 20,
    creditsTotal: 500,
    creditsRemaining: 120,
    currency: '€',
  },
  {
    id: '3',
    name: 'Higgsfield',
    icon: '🎬',
    renewalDay: 22,
    price: 15,
    creditsTotal: 50,
    creditsRemaining: 30,
    currency: '€',
  },
  {
    id: '4',
    name: 'Gemini Advanced',
    icon: '✨',
    renewalDay: 5,
    price: 22,
    creditsTotal: 200,
    creditsRemaining: 80,
    currency: '€',
  },
  {
    id: '5',
    name: 'Genspark',
    icon: '⚡',
    renewalDay: 18,
    price: 10,
    creditsTotal: 100,
    creditsRemaining: 65,
    currency: '€',
  },
  {
    id: '6',
    name: 'Freepik',
    icon: '🎨',
    renewalDay: 1,
    price: 12,
    creditsTotal: 100,
    creditsRemaining: 25,
    currency: '€',
  },
];

const STORAGE_KEY = 'ai-subscriptions';

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSubscriptions(JSON.parse(stored));
    } else {
      setSubscriptions(DEFAULT_SUBSCRIPTIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUBSCRIPTIONS));
    }
  }, []);

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    setSubscriptions((prev) => {
      const updated = prev.map((sub) =>
        sub.id === id ? { ...sub, ...updates } : sub
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const addSubscription = (subscription: Omit<Subscription, 'id'>) => {
    const newSub = { ...subscription, id: Date.now().toString() };
    setSubscriptions((prev) => {
      const updated = [...prev, newSub];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => {
      const updated = prev.filter((sub) => sub.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { subscriptions, updateSubscription, addSubscription, deleteSubscription };
}

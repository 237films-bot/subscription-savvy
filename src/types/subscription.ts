export type BillingCycle = 'monthly' | 'annual';

export type SubscriptionCategory = 'IA' | 'Productivité' | 'Design' | 'Vidéo' | 'Audio' | 'Autre';

export const CATEGORIES: SubscriptionCategory[] = ['IA', 'Productivité', 'Design', 'Vidéo', 'Audio', 'Autre'];

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export interface Subscription {
  id: string;
  name: string;
  icon: string;
  renewal_day: number;
  renewal_month?: number; // 1-12, only for annual
  price: number;
  credits_total: number;
  credits_remaining: number;
  currency: string;
  category?: SubscriptionCategory;
  billing_cycle?: BillingCycle;
  trial_end_date?: string;
  last_reset_date?: string;
}

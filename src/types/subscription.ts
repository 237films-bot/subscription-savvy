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

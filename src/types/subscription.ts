export interface Subscription {
  id: string;
  name: string;
  icon: string;
  renewalDay: number;
  price: number;
  creditsTotal: number;
  creditsRemaining: number;
  currency: string;
}

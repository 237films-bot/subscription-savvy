import { BillingCycle } from '@/types/subscription';

export function getDaysUntilRenewal(
  renewalDay: number, 
  billingCycle: BillingCycle = 'monthly',
  renewalMonth?: number
): number {
  const today = new Date();
  const renewalDate = getNextRenewalDate(renewalDay, billingCycle, renewalMonth);
  const diffTime = renewalDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getNextRenewalDate(
  renewalDay: number,
  billingCycle: BillingCycle = 'monthly',
  renewalMonth?: number
): Date {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentYear = today.getFullYear();

  if (billingCycle === 'annual' && renewalMonth) {
    // Annual: specific day and month
    const monthIndex = renewalMonth - 1; // Convert 1-12 to 0-11
    let renewalDate = new Date(currentYear, monthIndex, renewalDay);
    
    // If renewal date has passed this year, use next year
    if (renewalDate <= today) {
      renewalDate = new Date(currentYear + 1, monthIndex, renewalDay);
    }
    
    return renewalDate;
  } else {
    // Monthly: specific day each month
    if (renewalDay > currentDay) {
      return new Date(currentYear, currentMonth, renewalDay);
    }
    return new Date(currentYear, currentMonth + 1, renewalDay);
  }
}

export function formatDate(date: Date, includeYear: boolean = false): string {
  if (includeYear) {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function getUrgencyLevel(daysRemaining: number): 'critical' | 'warning' | 'normal' {
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'warning';
  return 'normal';
}

export function getDaysUntilTrialEnd(trialEndDate: string): number | null {
  if (!trialEndDate) return null;
  const today = new Date();
  const endDate = new Date(trialEndDate);
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isTrialActive(trialEndDate?: string): boolean {
  if (!trialEndDate) return false;
  const daysLeft = getDaysUntilTrialEnd(trialEndDate);
  return daysLeft !== null && daysLeft >= 0;
}

export function isLowCredits(remaining: number, total: number): boolean {
  if (total === 0) return false;
  return (remaining / total) <= 0.2;
}

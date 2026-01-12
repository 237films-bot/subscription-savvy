export function getDaysUntilRenewal(renewalDay: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let renewalDate: Date;

  if (renewalDay > currentDay) {
    renewalDate = new Date(currentYear, currentMonth, renewalDay);
  } else {
    renewalDate = new Date(currentYear, currentMonth + 1, renewalDay);
  }

  const diffTime = renewalDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getNextRenewalDate(renewalDay: number): Date {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  if (renewalDay > currentDay) {
    return new Date(currentYear, currentMonth, renewalDay);
  }
  return new Date(currentYear, currentMonth + 1, renewalDay);
}

export function formatDate(date: Date): string {
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

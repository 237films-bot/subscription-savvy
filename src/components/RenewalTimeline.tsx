import { Subscription } from '@/types/subscription';
import { getDaysUntilRenewal, formatDate, getNextRenewalDate, getUrgencyLevel } from '@/lib/dateUtils';

interface RenewalTimelineProps {
  subscriptions: Subscription[];
}

export function RenewalTimeline({ subscriptions }: RenewalTimelineProps) {
  const sorted = [...subscriptions]
    .map((sub) => ({
      ...sub,
      daysUntil: getDaysUntilRenewal(sub.renewal_day),
      renewalDate: getNextRenewalDate(sub.renewal_day),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">Prochains renouvellements</h2>
      <div className="space-y-3">
        {sorted.map((sub) => {
          const urgency = getUrgencyLevel(sub.daysUntil);
          return (
            <div
              key={sub.id}
              className="flex items-center gap-3"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  urgency === 'critical'
                    ? 'bg-destructive'
                    : urgency === 'warning'
                    ? 'bg-warning'
                    : 'bg-success'
                }`}
              />
              <span className="text-lg">{sub.icon}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{sub.name}</span>
              <span className="text-sm text-muted-foreground">{formatDate(sub.renewalDate)}</span>
              <span
                className={`text-sm font-semibold min-w-[3rem] text-right ${
                  urgency === 'critical'
                    ? 'text-destructive'
                    : urgency === 'warning'
                    ? 'text-warning'
                    : 'text-success'
                }`}
              >
                {sub.daysUntil}j
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

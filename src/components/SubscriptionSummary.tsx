import { Subscription } from '@/types/subscription';
import { getDaysUntilRenewal } from '@/lib/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarClock, Wallet, AlertTriangle } from 'lucide-react';

interface SubscriptionSummaryProps {
  subscriptions: Subscription[];
}

export function SubscriptionSummary({ subscriptions }: SubscriptionSummaryProps) {
  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.price, 0);
  
  const urgentSubscriptions = subscriptions.filter((sub) => {
    const daysUntil = getDaysUntilRenewal(sub.renewalDay);
    const creditsPercentage = (sub.creditsRemaining / sub.creditsTotal) * 100;
    return daysUntil <= 5 && creditsPercentage > 30;
  });

  const nextRenewal = subscriptions
    .map((sub) => ({ ...sub, daysUntil: getDaysUntilRenewal(sub.renewalDay) }))
    .sort((a, b) => a.daysUntil - b.daysUntil)[0];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-sm bg-primary/10 p-3">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Coût mensuel total</p>
            <p className="text-2xl font-bold text-foreground">{totalMonthly.toFixed(0)}€</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-sm bg-secondary/20 p-3">
            <CalendarClock className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Prochain renouvellement</p>
            {nextRenewal && (
              <p className="text-lg font-semibold text-foreground">
                {nextRenewal.name} dans {nextRenewal.daysUntil}j
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`rounded-sm p-3 ${urgentSubscriptions.length > 0 ? 'bg-destructive/10' : 'bg-accent'}`}>
            <AlertTriangle className={`h-5 w-5 ${urgentSubscriptions.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Crédits à utiliser</p>
            <p className={`text-lg font-semibold ${urgentSubscriptions.length > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {urgentSubscriptions.length > 0
                ? `${urgentSubscriptions.length} abonnement${urgentSubscriptions.length > 1 ? 's' : ''}`
                : 'Tout va bien ✓'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

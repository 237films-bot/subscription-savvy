import { useState } from 'react';
import { Subscription } from '@/types/subscription';
import { getDaysUntilRenewal, getNextRenewalDate, formatDate, getUrgencyLevel } from '@/lib/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Pencil, Check, X, Trash2 } from 'lucide-react';

interface SubscriptionCardProps {
  subscription: Subscription;
  onUpdate: (id: string, updates: Partial<Subscription>) => void;
  onDelete: (id: string) => void;
}

export function SubscriptionCard({ subscription, onUpdate, onDelete }: SubscriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editCredits, setEditCredits] = useState(subscription.creditsRemaining.toString());

  const daysUntil = getDaysUntilRenewal(subscription.renewalDay);
  const renewalDate = getNextRenewalDate(subscription.renewalDay);
  const urgency = getUrgencyLevel(daysUntil);
  const creditsPercentage = (subscription.creditsRemaining / subscription.creditsTotal) * 100;

  const handleSaveCredits = () => {
    const newCredits = parseInt(editCredits, 10);
    if (!isNaN(newCredits) && newCredits >= 0) {
      onUpdate(subscription.id, { creditsRemaining: Math.min(newCredits, subscription.creditsTotal) });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditCredits(subscription.creditsRemaining.toString());
    setIsEditing(false);
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <div
        className={`absolute top-0 left-0 h-1 w-full ${
          urgency === 'critical'
            ? 'bg-destructive'
            : urgency === 'warning'
            ? 'bg-chart-4'
            : 'bg-primary'
        }`}
      />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{subscription.icon}</span>
            <div>
              <h3 className="font-semibold text-foreground">{subscription.name}</h3>
              <p className="text-sm text-muted-foreground">
                {subscription.price}
                {subscription.currency}/mois
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(subscription.id)}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Renewal info */}
          <div className="flex items-center justify-between rounded-sm bg-accent p-3">
            <div>
              <p className="text-xs text-accent-foreground">Prochain renouvellement</p>
              <p className="font-medium text-foreground">{formatDate(renewalDate)}</p>
            </div>
            <div
              className={`text-right ${
                urgency === 'critical'
                  ? 'text-destructive'
                  : urgency === 'warning'
                  ? 'text-chart-4'
                  : 'text-foreground'
              }`}
            >
              <p className="text-2xl font-bold">{daysUntil}</p>
              <p className="text-xs">jours</p>
            </div>
          </div>

          {/* Credits */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Crédits restants</span>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={editCredits}
                    onChange={(e) => setEditCredits(e.target.value)}
                    className="h-7 w-16 text-right text-sm"
                    min={0}
                    max={subscription.creditsTotal}
                  />
                  <span className="text-sm text-muted-foreground">/ {subscription.creditsTotal}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveCredits}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">
                    {subscription.creditsRemaining}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {subscription.creditsTotal}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <Progress value={creditsPercentage} className="h-2" />
            {creditsPercentage > 50 && daysUntil <= 5 && (
              <p className="text-xs text-destructive font-medium">
                ⚠️ Pensez à utiliser vos crédits avant le renouvellement !
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

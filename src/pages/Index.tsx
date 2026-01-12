import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { AddSubscriptionDialog } from '@/components/AddSubscriptionDialog';
import { SubscriptionSummary } from '@/components/SubscriptionSummary';
import { getDaysUntilRenewal } from '@/lib/dateUtils';

const Index = () => {
  const { subscriptions, updateSubscription, addSubscription, deleteSubscription } = useSubscriptions();

  const sortedSubscriptions = [...subscriptions].sort(
    (a, b) => getDaysUntilRenewal(a.renewalDay) - getDaysUntilRenewal(b.renewalDay)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Mes Abonnements IA
            </h1>
            <p className="mt-1 text-muted-foreground">
              Suivez vos crédits et dates de renouvellement
            </p>
          </div>
          <AddSubscriptionDialog onAdd={addSubscription} />
        </div>

        {/* Summary */}
        <div className="mb-8">
          <SubscriptionSummary subscriptions={subscriptions} />
        </div>

        {/* Subscriptions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onUpdate={updateSubscription}
              onDelete={deleteSubscription}
            />
          ))}
        </div>

        {subscriptions.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Aucun abonnement pour le moment.
            </p>
            <p className="text-sm text-muted-foreground">
              Cliquez sur "Ajouter un abonnement" pour commencer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

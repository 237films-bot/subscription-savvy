import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { AddSubscriptionDialog } from '@/components/AddSubscriptionDialog';
import { RenewalTimeline } from '@/components/RenewalTimeline';
import { AuthForm } from '@/components/AuthForm';
import { getDaysUntilRenewal } from '@/lib/dateUtils';
import { Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { subscriptions, loading: subsLoading, updateSubscription, addSubscription, deleteSubscription } = useSubscriptions();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const sortedSubscriptions = [...subscriptions].sort(
    (a, b) => getDaysUntilRenewal(a.renewal_day) - getDaysUntilRenewal(b.renewal_day)
  );

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + Number(sub.price), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
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
          <div className="flex items-center gap-2">
            <AddSubscriptionDialog onAdd={addSubscription} />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Timeline - Most important */}
        {subscriptions.length > 0 && (
          <div className="mb-8">
            <RenewalTimeline subscriptions={subscriptions} />
          </div>
        )}

        {/* Loading state */}
        {subsLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement des abonnements...</p>
          </div>
        )}

        {/* Subscriptions Grid */}
        {!subsLoading && (
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
        )}

        {!subsLoading && subscriptions.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Aucun abonnement pour le moment.
            </p>
            <p className="text-sm text-muted-foreground">
              Cliquez sur "Ajouter un abonnement" pour commencer.
            </p>
          </div>
        )}

        {/* Footer - Total cost */}
        {subscriptions.length > 0 && (
          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">Coût mensuel total : <span className="font-semibold text-foreground">{totalMonthly.toFixed(0)}€</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

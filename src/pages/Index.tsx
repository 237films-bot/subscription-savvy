import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useAuth } from '@/hooks/useAuth';
import { SortableSubscriptionCard } from '@/components/SortableSubscriptionCard';
import { AddSubscriptionDialog } from '@/components/AddSubscriptionDialog';
import { RenewalTimeline } from '@/components/RenewalTimeline';
import { CreditUsageChart } from '@/components/CreditUsageChart';
import { CreditHistoryTable } from '@/components/CreditHistoryTable';
import { CreditHistoryChart } from '@/components/CreditHistoryChart';
import { AuthForm } from '@/components/AuthForm';
import { Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { subscriptions, loading: subsLoading, updateSubscription, addSubscription, deleteSubscription, reorderSubscriptions } = useSubscriptions();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSubscriptions(active.id as string, over.id as string);
    }
  };

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

  // Calculate total monthly cost (user enters monthly price for all subscriptions)
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

        {/* Subscriptions Grid with Drag & Drop */}
        {!subsLoading && subscriptions.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={subscriptions.map(s => s.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subscriptions.map((subscription) => (
                  <SortableSubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onUpdate={updateSubscription}
                    onDelete={deleteSubscription}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

        {/* Credit Usage Chart */}
        {subscriptions.length > 0 && (
          <div className="mt-8">
            <CreditUsageChart subscriptions={subscriptions} />
          </div>
        )}

        {/* Credit History Table */}
        {subscriptions.length > 0 && (
          <div className="mt-8">
            <CreditHistoryTable subscriptions={subscriptions} />
          </div>
        )}

        {/* Credit History Chart - 6 months evolution */}
        {subscriptions.length > 0 && (
          <div className="mt-8">
            <CreditHistoryChart subscriptions={subscriptions} />
          </div>
        )}

        {/* Footer - Total cost */}
        {subscriptions.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
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

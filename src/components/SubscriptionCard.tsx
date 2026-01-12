import { useState } from 'react';
import { Subscription } from '@/types/subscription';
import { getDaysUntilRenewal, getNextRenewalDate, formatDate, getUrgencyLevel } from '@/lib/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface SubscriptionCardProps {
  subscription: Subscription;
  onUpdate: (id: string, updates: Partial<Subscription>) => void;
  onDelete: (id: string) => void;
}

const EMOJI_OPTIONS = ['🤖', '💜', '🎬', '✨', '⚡', '🎨', '🧠', '🔮', '🚀', '💡'];

export function SubscriptionCard({ subscription, onUpdate, onDelete }: SubscriptionCardProps) {
  const [isEditingCredits, setIsEditingCredits] = useState(false);
  const [editCredits, setEditCredits] = useState(subscription.credits_remaining.toString());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: subscription.name,
    icon: subscription.icon,
    renewal_day: subscription.renewal_day.toString(),
    price: subscription.price.toString(),
    credits_total: subscription.credits_total.toString(),
  });

  const daysUntil = getDaysUntilRenewal(subscription.renewal_day);
  const renewalDate = getNextRenewalDate(subscription.renewal_day);
  const urgency = getUrgencyLevel(daysUntil);
  const creditsPercentage = (subscription.credits_remaining / subscription.credits_total) * 100;

  const handleSaveCredits = () => {
    const newCredits = parseInt(editCredits, 10);
    if (!isNaN(newCredits) && newCredits >= 0) {
      onUpdate(subscription.id, { credits_remaining: Math.min(newCredits, subscription.credits_total) });
    }
    setIsEditingCredits(false);
  };

  const handleCancelCredits = () => {
    setEditCredits(subscription.credits_remaining.toString());
    setIsEditingCredits(false);
  };

  const handleSaveAll = () => {
    onUpdate(subscription.id, {
      name: editForm.name,
      icon: editForm.icon,
      renewal_day: parseInt(editForm.renewal_day, 10),
      price: parseFloat(editForm.price),
      credits_total: parseInt(editForm.credits_total, 10),
    });
    setIsEditDialogOpen(false);
  };

  const openEditDialog = () => {
    setEditForm({
      name: subscription.name,
      icon: subscription.icon,
      renewal_day: subscription.renewal_day.toString(),
      price: subscription.price.toString(),
      credits_total: subscription.credits_total.toString(),
    });
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg border-border/50 hover:border-primary/30">
        <div
          className={`absolute top-0 left-0 h-1 w-full ${
            urgency === 'critical'
              ? 'bg-destructive'
              : urgency === 'warning'
              ? 'bg-warning'
              : 'bg-success'
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
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={openEditDialog}
              >
                <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(subscription.id)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* Renewal info */}
            <div className="flex items-center justify-between rounded-md bg-accent/50 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Renouvellement</p>
                <p className="font-medium text-foreground">{formatDate(renewalDate)}</p>
              </div>
              <div
                className={`text-right ${
                  urgency === 'critical'
                    ? 'text-destructive'
                    : urgency === 'warning'
                    ? 'text-warning'
                    : 'text-success'
                }`}
              >
                <p className="text-2xl font-bold">{daysUntil}</p>
                <p className="text-xs">jours</p>
              </div>
            </div>

            {/* Credits */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Crédits</span>
                {isEditingCredits ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={editCredits}
                      onChange={(e) => setEditCredits(e.target.value)}
                      className="h-7 w-16 text-right text-sm"
                      min={0}
                      max={subscription.credits_total}
                    />
                    <span className="text-sm text-muted-foreground">/ {subscription.credits_total}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveCredits}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelCredits}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                    onClick={() => setIsEditingCredits(true)}
                  >
                    <span className="font-semibold text-foreground">
                      {subscription.credits_remaining}
                    </span>
                    <span className="text-sm text-muted-foreground">/ {subscription.credits_total}</span>
                  </button>
                )}
              </div>
              <Progress value={creditsPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier {subscription.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Icône</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`text-2xl p-2 rounded-md transition-colors ${
                      editForm.icon === emoji ? 'bg-primary text-primary-foreground' : 'bg-accent hover:bg-muted'
                    }`}
                    onClick={() => setEditForm({ ...editForm, icon: emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-day">Jour de renouvellement</Label>
                <Input
                  id="edit-day"
                  type="number"
                  min={1}
                  max={31}
                  value={editForm.renewal_day}
                  onChange={(e) => setEditForm({ ...editForm, renewal_day: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Prix (€/mois)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-credits">Crédits mensuels</Label>
              <Input
                id="edit-credits"
                type="number"
                value={editForm.credits_total}
                onChange={(e) => setEditForm({ ...editForm, credits_total: e.target.value })}
              />
            </div>

            <Button onClick={handleSaveAll} className="w-full">
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

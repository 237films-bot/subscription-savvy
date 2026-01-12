import { useState } from 'react';
import { Subscription, CATEGORIES, MONTHS, BillingCycle, SubscriptionCategory } from '@/types/subscription';
import { getDaysUntilRenewal, getNextRenewalDate, formatDate, getUrgencyLevel, isLowCredits, getDaysUntilTrialEnd, isTrialActive } from '@/lib/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Pencil, Check, X, Trash2, AlertTriangle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  
  const billingCycle = subscription.billing_cycle || 'monthly';
  const isAnnual = billingCycle === 'annual';
  
  const [editForm, setEditForm] = useState({
    name: subscription.name,
    icon: subscription.icon,
    renewal_day: subscription.renewal_day.toString(),
    renewal_month: (subscription.renewal_month || 1).toString(),
    price: subscription.price.toString(),
    credits_total: subscription.credits_total.toString(),
    category: subscription.category || 'IA',
    billing_cycle: billingCycle,
    trial_end_date: subscription.trial_end_date || '',
  });

  const daysUntil = getDaysUntilRenewal(subscription.renewal_day, billingCycle, subscription.renewal_month);
  const renewalDate = getNextRenewalDate(subscription.renewal_day, billingCycle, subscription.renewal_month);
  const urgency = getUrgencyLevel(daysUntil);
  const creditsPercentage = (subscription.credits_remaining / subscription.credits_total) * 100;
  const lowCredits = isLowCredits(subscription.credits_remaining, subscription.credits_total);
  const trialActive = isTrialActive(subscription.trial_end_date);
  const trialDaysLeft = subscription.trial_end_date ? getDaysUntilTrialEnd(subscription.trial_end_date) : null;

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
    const isAnnualEdit = editForm.billing_cycle === 'annual';
    onUpdate(subscription.id, {
      name: editForm.name,
      icon: editForm.icon,
      renewal_day: parseInt(editForm.renewal_day, 10),
      renewal_month: isAnnualEdit ? parseInt(editForm.renewal_month, 10) : undefined,
      price: parseFloat(editForm.price),
      credits_total: parseInt(editForm.credits_total, 10),
      category: editForm.category as SubscriptionCategory,
      billing_cycle: editForm.billing_cycle as BillingCycle,
      trial_end_date: editForm.trial_end_date || undefined,
    });
    setIsEditDialogOpen(false);
  };

  const openEditDialog = () => {
    setEditForm({
      name: subscription.name,
      icon: subscription.icon,
      renewal_day: subscription.renewal_day.toString(),
      renewal_month: (subscription.renewal_month || 1).toString(),
      price: subscription.price.toString(),
      credits_total: subscription.credits_total.toString(),
      category: subscription.category || 'IA',
      billing_cycle: billingCycle,
      trial_end_date: subscription.trial_end_date || '',
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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {subscription.price}{subscription.currency}/mois
                  </p>
                  {subscription.category && (
                    <Badge variant="secondary" className="text-xs">
                      {subscription.category}
                    </Badge>
                  )}
                </div>
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

          {/* Trial Badge */}
          {trialActive && trialDaysLeft !== null && (
            <div className="mt-3 flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Période d'essai : {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} restant{trialDaysLeft > 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {/* Renewal info */}
            <div className="flex items-center justify-between rounded-md bg-accent/50 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Renouvellement</p>
                <p className="font-medium text-foreground">
                  {formatDate(renewalDate, isAnnual)}
                </p>
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Crédits</span>
                  {lowCredits && (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                </div>
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
                    <span className={`font-semibold ${lowCredits ? 'text-warning' : 'text-foreground'}`}>
                      {subscription.credits_remaining}
                    </span>
                    <span className="text-sm text-muted-foreground">/ {subscription.credits_total}</span>
                  </button>
                )}
              </div>
              <Progress 
                value={creditsPercentage} 
                className={`h-2 ${lowCredits ? '[&>div]:bg-warning' : ''}`} 
              />
              {lowCredits && (
                <p className="text-xs text-warning">
                  ⚠️ Moins de 20% de crédits restants
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select 
                value={editForm.category} 
                onValueChange={(v) => setEditForm({ ...editForm, category: v as SubscriptionCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-between p-3 rounded-md bg-accent/50">
              <div>
                <Label>Cycle de facturation</Label>
                <p className="text-xs text-muted-foreground">
                  {editForm.billing_cycle === 'monthly' ? 'Renouvellement mensuel' : 'Renouvellement annuel'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${editForm.billing_cycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Mensuel
                </span>
                <Switch
                  checked={editForm.billing_cycle === 'annual'}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, billing_cycle: checked ? 'annual' : 'monthly' })}
                />
                <span className={`text-sm ${editForm.billing_cycle === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Annuel
                </span>
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
              {editForm.billing_cycle === 'annual' && (
                <div className="space-y-2">
                  <Label>Mois de renouvellement</Label>
                  <Select 
                    value={editForm.renewal_month} 
                    onValueChange={(v) => setEditForm({ ...editForm, renewal_month: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">
                  Prix ({editForm.billing_cycle === 'monthly' ? '€/mois' : '€/an'})
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-credits">
                  Crédits {editForm.billing_cycle === 'monthly' ? 'mensuels' : 'annuels'}
                </Label>
                <Input
                  id="edit-credits"
                  type="number"
                  value={editForm.credits_total}
                  onChange={(e) => setEditForm({ ...editForm, credits_total: e.target.value })}
                />
              </div>
            </div>

            {/* Trial End Date */}
            <div className="space-y-2">
              <Label htmlFor="edit-trial">Fin de période d'essai</Label>
              <Input
                id="edit-trial"
                type="date"
                value={editForm.trial_end_date}
                onChange={(e) => setEditForm({ ...editForm, trial_end_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide si pas de période d'essai
              </p>
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

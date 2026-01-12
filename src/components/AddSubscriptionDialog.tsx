import { useState } from 'react';
import { Subscription, CATEGORIES, MONTHS, BillingCycle, SubscriptionCategory } from '@/types/subscription';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface AddSubscriptionDialogProps {
  onAdd: (subscription: Omit<Subscription, 'id'>) => void;
}

const EMOJI_OPTIONS = ['🤖', '💜', '🎬', '✨', '⚡', '🎨', '🧠', '🔮', '🚀', '💡'];

export function AddSubscriptionDialog({ onAdd }: AddSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🤖');
  const [renewalDay, setRenewalDay] = useState('1');
  const [renewalMonth, setRenewalMonth] = useState('1');
  const [price, setPrice] = useState('');
  const [creditsTotal, setCreditsTotal] = useState('');
  const [category, setCategory] = useState<SubscriptionCategory>('IA');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [trialEndDate, setTrialEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !renewalDay || !price || !creditsTotal) return;

    onAdd({
      name,
      icon,
      renewal_day: parseInt(renewalDay, 10),
      renewal_month: billingCycle === 'annual' ? parseInt(renewalMonth, 10) : undefined,
      price: parseFloat(price),
      credits_total: parseInt(creditsTotal, 10),
      credits_remaining: parseInt(creditsTotal, 10),
      currency: '€',
      category,
      billing_cycle: billingCycle,
      trial_end_date: trialEndDate || undefined,
    });

    // Reset form
    setName('');
    setIcon('🤖');
    setRenewalDay('1');
    setRenewalMonth('1');
    setPrice('');
    setCreditsTotal('');
    setCategory('IA');
    setBillingCycle('monthly');
    setTrialEndDate('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un abonnement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel abonnement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du service</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Claude Pro"
              required
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
                    icon === emoji ? 'bg-primary text-primary-foreground' : 'bg-accent hover:bg-muted'
                  }`}
                  onClick={() => setIcon(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as SubscriptionCategory)}>
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
                {billingCycle === 'monthly' ? 'Renouvellement mensuel' : 'Renouvellement annuel'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Mensuel
              </span>
              <Switch
                checked={billingCycle === 'annual'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
              />
              <span className={`text-sm ${billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annuel
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="renewalDay">Jour de renouvellement</Label>
              <Input
                id="renewalDay"
                type="number"
                min={1}
                max={31}
                value={renewalDay}
                onChange={(e) => setRenewalDay(e.target.value)}
                required
              />
            </div>
            {billingCycle === 'annual' && (
              <div className="space-y-2">
                <Label>Mois de renouvellement</Label>
                <Select value={renewalMonth} onValueChange={setRenewalMonth}>
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
            <div className="space-y-2">
              <Label htmlFor="price">
                Prix ({billingCycle === 'monthly' ? '€/mois' : '€/an'})
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={billingCycle === 'monthly' ? '20' : '200'}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">
              Crédits {billingCycle === 'monthly' ? 'mensuels' : 'annuels'}
            </Label>
            <Input
              id="credits"
              type="number"
              value={creditsTotal}
              onChange={(e) => setCreditsTotal(e.target.value)}
              placeholder="100"
              required
            />
          </div>

          {/* Trial End Date */}
          <div className="space-y-2">
            <Label htmlFor="trial">Fin de période d'essai (optionnel)</Label>
            <Input
              id="trial"
              type="date"
              value={trialEndDate}
              onChange={(e) => setTrialEndDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide si pas de période d'essai
            </p>
          </div>

          <Button type="submit" className="w-full">
            Ajouter
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

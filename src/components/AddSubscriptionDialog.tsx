import { useState } from 'react';
import { Subscription } from '@/types/subscription';
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
  const [price, setPrice] = useState('');
  const [creditsTotal, setCreditsTotal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !renewalDay || !price || !creditsTotal) return;

    onAdd({
      name,
      icon,
      renewalDay: parseInt(renewalDay, 10),
      price: parseFloat(price),
      creditsTotal: parseInt(creditsTotal, 10),
      creditsRemaining: parseInt(creditsTotal, 10),
      currency: '€',
    });

    setName('');
    setIcon('🤖');
    setRenewalDay('1');
    setPrice('');
    setCreditsTotal('');
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel abonnement IA</DialogTitle>
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
                  className={`text-2xl p-2 rounded-sm transition-colors ${
                    icon === emoji ? 'bg-primary text-primary-foreground' : 'bg-accent hover:bg-muted'
                  }`}
                  onClick={() => setIcon(emoji)}
                >
                  {emoji}
                </button>
              ))}
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
            <div className="space-y-2">
              <Label htmlFor="price">Prix (€/mois)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">Crédits mensuels</Label>
            <Input
              id="credits"
              type="number"
              value={creditsTotal}
              onChange={(e) => setCreditsTotal(e.target.value)}
              placeholder="100"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Ajouter
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

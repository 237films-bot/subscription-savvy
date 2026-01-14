import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, AlertTriangle } from 'lucide-react';

interface PassphraseFormProps {
  onVerify: (passphrase: string) => Promise<{
    success: boolean;
    error?: string;
    remainingAttempts?: number;
    blockedFor?: number;
  }>;
}

export function PassphraseForm({ onVerify }: PassphraseFormProps) {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [blockedFor, setBlockedFor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await onVerify(passphrase);

    if (!result.success) {
      setError(result.error || 'Erreur inconnue');
      setRemainingAttempts(result.remainingAttempts ?? null);
      setBlockedFor(result.blockedFor ?? null);
      setPassphrase('');
    }
    
    setLoading(false);
  };

  const isBlocked = blockedFor !== null && blockedFor > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-serif">
            Accès sécurisé
          </CardTitle>
          <CardDescription>
            Entrez la passphrase pour accéder à l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passphrase">Passphrase</Label>
              <Input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isBlocked}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p>{error}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="text-xs mt-1 opacity-80">
                      {remainingAttempts} tentative{remainingAttempts > 1 ? 's' : ''} restante{remainingAttempts > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || isBlocked}
            >
              {loading ? 'Vérification...' : isBlocked ? `Bloqué (${blockedFor} min)` : 'Accéder'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

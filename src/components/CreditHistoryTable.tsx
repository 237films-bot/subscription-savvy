import { useMemo } from 'react';
import { Subscription } from '@/types/subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CreditHistoryTableProps {
  subscriptions: Subscription[];
}

interface HistoryEntry {
  subscriptionId: string;
  subscriptionName: string;
  icon: string;
  month: string;
  monthLabel: string;
  creditsUsed: number;
  creditsTotal: number;
  percentage: number;
}

export function CreditHistoryTable({ subscriptions }: CreditHistoryTableProps) {
  // Generate simulated history based on current state and last_reset_date
  // In a real app, this would come from the credit_history table
  const historyData = useMemo(() => {
    const entries: HistoryEntry[] = [];
    const today = new Date();
    
    subscriptions.forEach((sub) => {
      // Current period (since last reset or this month)
      const lastReset = sub.last_reset_date ? new Date(sub.last_reset_date) : null;
      const creditsUsed = sub.credits_total - sub.credits_remaining;
      
      if (lastReset || creditsUsed > 0) {
        const monthDate = lastReset || today;
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        entries.push({
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          icon: sub.icon,
          month: monthKey,
          monthLabel,
          creditsUsed,
          creditsTotal: sub.credits_total,
          percentage: sub.credits_total > 0 ? Math.round((creditsUsed / sub.credits_total) * 100) : 0,
        });
      }
    });
    
    // Sort by month descending, then by subscription name
    return entries.sort((a, b) => {
      const monthCompare = b.month.localeCompare(a.month);
      if (monthCompare !== 0) return monthCompare;
      return a.subscriptionName.localeCompare(b.subscriptionName);
    });
  }, [subscriptions]);

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups = new Map<string, { label: string; entries: HistoryEntry[] }>();
    
    historyData.forEach((entry) => {
      if (!groups.has(entry.month)) {
        groups.set(entry.month, { label: entry.monthLabel, entries: [] });
      }
      groups.get(entry.month)!.entries.push(entry);
    });
    
    return Array.from(groups.entries()).slice(0, 3); // Last 3 months
  }, [historyData]);

  if (groupedByMonth.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique d'utilisation des crédits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            L'historique sera disponible après le premier cycle de renouvellement.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-destructive';
    if (percentage >= 50) return 'text-warning';
    return 'text-success';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique d'utilisation des crédits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {groupedByMonth.map(([monthKey, { label, entries }]) => (
          <div key={monthKey}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{label}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Abonnement</TableHead>
                  <TableHead className="text-right">Utilisés</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={`${monthKey}-${entry.subscriptionId}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{entry.icon}</span>
                        <span className="font-medium">{entry.subscriptionName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {entry.creditsUsed.toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {entry.creditsTotal.toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums font-semibold ${getUsageColor(entry.percentage)}`}>
                      {entry.percentage}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

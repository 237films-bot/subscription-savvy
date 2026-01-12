import { useMemo } from 'react';
import { Subscription } from '@/types/subscription';
import { useCreditHistory } from '@/hooks/useCreditHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CreditHistoryChartProps {
  subscriptions: Subscription[];
}

// Color palette for lines
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

export function CreditHistoryChart({ subscriptions }: CreditHistoryChartProps) {
  const { getMonthlyUsageBySubscription, loading } = useCreditHistory();
  
  const chartData = useMemo(() => {
    const today = new Date();
    const months: { key: string; label: string }[] = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('fr-FR', { month: 'short' }),
      });
    }

    const usageBySubscription = getMonthlyUsageBySubscription();

    // Build chart data with real historical data
    return months.map((month) => {
      const dataPoint: Record<string, string | number> = {
        month: month.label,
      };

      subscriptions.forEach((sub) => {
        const subHistory = usageBySubscription.get(sub.id);
        const monthData = subHistory?.find(m => m.month === month.key);
        
        if (monthData) {
          // Use real data from credit_history
          dataPoint[sub.name] = monthData.percentage;
        } else {
          // No data for this month - leave empty (will show gap in line)
          dataPoint[sub.name] = 0;
        }
      });

      return dataPoint;
    });
  }, [subscriptions, getMonthlyUsageBySubscription]);

  // Check if there's any real data to display
  const hasRealData = useMemo(() => {
    return chartData.some(point => 
      subscriptions.some(sub => (point[sub.name] as number) > 0)
    );
  }, [chartData, subscriptions]);

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Évolution de la consommation (6 mois)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
            Chargement...
          </div>
        ) : !hasRealData ? (
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
            Pas encore de données d'historique. L'historique se remplira au fur et à mesure des renouvellements.
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name,
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => {
                    const sub = subscriptions.find(s => s.name === value);
                    return sub ? `${sub.icon} ${value}` : value;
                  }}
                />
                {subscriptions.map((sub, index) => (
                  <Line
                    key={sub.id}
                    type="monotone"
                    dataKey={sub.name}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

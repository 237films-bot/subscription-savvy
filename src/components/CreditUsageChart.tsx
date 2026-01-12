import { useMemo } from 'react';
import { Subscription } from '@/types/subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface CreditUsageChartProps {
  subscriptions: Subscription[];
}

export function CreditUsageChart({ subscriptions }: CreditUsageChartProps) {
  const chartData = useMemo(() => {
    return subscriptions.map((sub) => {
      const used = sub.credits_total - sub.credits_remaining;
      const percentage = sub.credits_total > 0 ? Math.round((used / sub.credits_total) * 100) : 0;
      return {
        name: sub.name,
        icon: sub.icon,
        used,
        remaining: sub.credits_remaining,
        total: sub.credits_total,
        percentage,
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [subscriptions]);

  const totalUsed = subscriptions.reduce((sum, sub) => sum + (sub.credits_total - sub.credits_remaining), 0);
  const totalCredits = subscriptions.reduce((sum, sub) => sum + sub.credits_total, 0);
  const overallPercentage = totalCredits > 0 ? Math.round((totalUsed / totalCredits) * 100) : 0;

  if (subscriptions.length === 0) {
    return null;
  }

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'hsl(var(--destructive))';
    if (percentage >= 50) return 'hsl(var(--warning))';
    return 'hsl(var(--success))';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Utilisation des crédits
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{overallPercentage}%</p>
            <p className="text-xs text-muted-foreground">utilisés au total</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-foreground">{data.icon} {data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.used} / {data.total} crédits utilisés
                        </p>
                        <p className="text-sm font-medium" style={{ color: getBarColor(data.percentage) }}>
                          {data.percentage}% utilisés
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--success))' }} />
            <span className="text-muted-foreground">&lt; 50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--warning))' }} />
            <span className="text-muted-foreground">50-80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
            <span className="text-muted-foreground">&gt; 80%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

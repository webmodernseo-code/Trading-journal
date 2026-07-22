'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function EquityCurveChart({ data }: { data: { date: string; cumulativePnl: number }[] }) {
  return (
    <div className="h-40 rounded-xl border border-border-subtle bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="var(--color-muted)" fontSize={11} />
          <YAxis stroke="var(--color-muted)" fontSize={11} />
          <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
          <Line type="monotone" dataKey="cumulativePnl" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

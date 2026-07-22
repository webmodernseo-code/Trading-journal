'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function EquityCurveChart({ data }: { data: { date: string; cumulativePnl: number }[] }) {
  return (
    <div className="h-40 rounded-xl border border-border-subtle bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
          <YAxis stroke="#9ca3af" fontSize={11} />
          <Tooltip contentStyle={{ background: '#12151a', border: '1px solid rgba(255,255,255,0.1)' }} />
          <Line type="monotone" dataKey="cumulativePnl" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

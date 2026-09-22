import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TelemetryData {
  timestamp: string;
  value: number;
}

interface TelemetryChartProps {
  data: TelemetryData[];
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ data, warningThreshold, criticalThreshold }) => {
  // Format data for Recharts
  const chartData = data.slice().reverse().map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: Number(d.value.toFixed(2))
  }));

  return (
    <div className="h-48 w-full mt-4 bg-slate-950 p-2 rounded-lg border border-slate-800">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 10}} />
          <YAxis stroke="#94a3b8" tick={{fontSize: 10}} domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ color: '#60a5fa' }}
          />
          <ReferenceLine y={warningThreshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'WARN', fill: '#f59e0b', fontSize: 10 }} />
          <ReferenceLine y={criticalThreshold} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'CRIT', fill: '#ef4444', fontSize: 10 }} />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

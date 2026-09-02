"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function CategoryPieChart({ data }: { data: any[] }) {
  // Generate distinct colors for categories
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--success))',
    'hsl(var(--destructive))',
    'hsl(var(--info))',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#10b981',
    '#6366f1',
    '#f43f5e',
    '#14b8a6',
    '#84cc16'
  ];

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-[hsl(var(--ink-secondary))] italic bg-[hsl(var(--surface-elevated))] rounded-lg">
        No expense data available for this period.
      </div>
    );
  }

  // Format tooltip to show ₹
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] p-3 rounded-lg shadow-lg">
          <p className="font-medium text-sm text-[hsl(var(--ink))]">{payload[0].name}</p>
          <p className="font-bold text-[hsl(var(--destructive))]">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={customTooltip} />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} 
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

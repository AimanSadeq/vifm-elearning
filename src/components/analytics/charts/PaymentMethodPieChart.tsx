"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
}

interface PaymentMethodPieChartProps {
  data: PaymentMethodData[];
}

const COLORS = [
  "hsl(var(--brand-600))",
  "hsl(var(--success))",
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--accent-600))",
];

export function PaymentMethodPieChart({ data }: PaymentMethodPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No payment data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="amount"
          nameKey="method"
          label={({ method, percent }) =>
            `${method} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `$${Number(value).toLocaleString()}`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

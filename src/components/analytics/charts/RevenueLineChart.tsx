"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueData {
  month: string;
  revenue: number;
  transactions: number;
}

interface RevenueLineChartProps {
  data: RevenueData[];
}

export function RevenueLineChart({ data }: RevenueLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No revenue data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--brand-600))"
          strokeWidth={2}
          name="Revenue"
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="transactions"
          stroke="hsl(var(--info))"
          strokeWidth={2}
          name="Transactions"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

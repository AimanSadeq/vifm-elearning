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

interface EffectivenessTrendData {
  month: string;
  responses: number;
  avgRating: number | null;
}

interface EffectivenessTrendChartProps {
  data: EffectivenessTrendData[];
}

export function EffectivenessTrendChart({ data }: EffectivenessTrendChartProps) {
  if (data.length === 0 || data.every((d) => d.responses === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No follow-up responses yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" allowDecimals={false} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="responses"
          stroke="hsl(var(--brand-600))"
          strokeWidth={2}
          name="Responses"
          dot={{ r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgRating"
          stroke="hsl(var(--info))"
          strokeWidth={2}
          name="Avg applied rating (/5)"
          dot={{ r: 4 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

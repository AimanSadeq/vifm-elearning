"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface EnrollmentData {
  month: string;
  enrollments: number;
  completions: number;
}

interface EnrollmentBarChartProps {
  data: EnrollmentData[];
}

export function EnrollmentBarChart({ data }: EnrollmentBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No enrollment data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="enrollments"
          fill="hsl(var(--brand-600))"
          name="Enrollments"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="completions"
          fill="hsl(var(--success))"
          name="Completions"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

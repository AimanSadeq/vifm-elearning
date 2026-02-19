"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopCourseData {
  title: string;
  enrollments: number;
  revenue: number;
}

interface TopCoursesBarChartProps {
  data: TopCourseData[];
  dataKey?: "enrollments" | "revenue";
}

export function TopCoursesBarChart({
  data,
  dataKey = "enrollments",
}: TopCoursesBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No course data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis
          dataKey="title"
          type="category"
          width={90}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) =>
            dataKey === "revenue"
              ? `$${Number(value).toLocaleString()}`
              : Number(value).toLocaleString()
          }
        />
        <Bar
          dataKey={dataKey}
          fill={
            dataKey === "revenue"
              ? "hsl(var(--success))"
              : "hsl(var(--brand-600))"
          }
          name={dataKey === "revenue" ? "Revenue" : "Enrollments"}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

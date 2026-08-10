"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DietAnalysis } from "@/types/nutrition";

interface CaloriesBarProps {
  data: DietAnalysis[];
}

export default function CaloriesBar({
  data,
}: CaloriesBarProps) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-500">
        No data to display.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="diet" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{
            value: "kcal",
            angle: -90,
            position: "insideLeft",
            fontSize: 12,
          }}
        />
        <Tooltip />
        <Bar
          dataKey="calories"
          name="Average calories"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

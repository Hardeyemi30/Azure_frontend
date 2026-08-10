"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CaloriesPieItem } from "@/types/nutrition";

interface CaloriesPieProps {
  data: CaloriesPieItem[];
}

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#ca8a04",
];

export default function CaloriesPie({
  data,
}: CaloriesPieProps) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-500">
        No data to display.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ name }) => name}
        >
          {data.map((point, index) => (
            <Cell
              key={point.name}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

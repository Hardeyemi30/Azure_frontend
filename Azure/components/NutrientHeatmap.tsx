"use client";

import { Fragment } from "react";
import type { HeatmapItem } from "@/types/nutrition";

interface NutrientHeatmapProps {
  data: HeatmapItem[];
}

export default function NutrientHeatmap({
  data,
}: NutrientHeatmapProps) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-500">
        No data to display.
      </p>
    );
  }

  const rows = [...new Set(data.map((point) => point.x))];
  const columns = [...new Set(data.map((point) => point.y))];
  const max = Math.max(
    ...data.map((point) => Math.abs(point.value))
  );

  const valueAt = (x: string, y: string) =>
    data.find((point) => point.x === x && point.y === y)
      ?.value ?? 0;

  return (
    <div
      className="grid gap-1 py-4 text-xs"
      style={{
        gridTemplateColumns: `90px repeat(${columns.length}, 1fr)`,
      }}
    >
      <div />
      {columns.map((column) => (
        <div
          key={column}
          className="text-center font-medium text-gray-600"
        >
          {column}
        </div>
      ))}

      {rows.map((row) => (
        <Fragment key={row}>
          <div className="flex items-center font-medium text-gray-600">
            {row}
          </div>
          {columns.map((column) => {
            const value = valueAt(row, column);
            const intensity = max
              ? Math.abs(value) / max
              : 0;

            return (
              <div
                key={column}
                title={`${row} · ${column}: ${value}`}
                className="rounded py-3 text-center"
                style={{
                  background:
                    value < 0
                      ? `rgba(220, 38, 38, ${intensity})`
                      : `rgba(37, 99, 235, ${intensity})`,
                  color:
                    intensity > 0.5 ? "#fff" : "#1f2937",
                }}
              >
                {value}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

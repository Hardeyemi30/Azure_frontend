"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  NutritionAnalysis,
} from "@/types/nutrition";

import {
  getNutritionAnalysis,
} from "@/services/nutritionApi";

import { useAuth } from "../contexts/authContext";

import CaloriesBar from "./CaloriesBar";
import CaloriesPie from "./CaloriesPie";
import NutrientHeatmap from "./NutrientHeatmap";
import ProteinCaloriesScatter from "./ProteinCaloriesScatter";
import RecipeSearch from "./RecipeSearch";

export default function Dashboard() {
  const {
    user,
    logout,
  } = useAuth();

  const [
    analysis,
    setAnalysis,
  ] = useState<NutritionAnalysis | null>(
    null
  );

  const [
    generatedAt,
    setGeneratedAt,
  ] = useState<string | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // Prevent hydration mismatch
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response =
          await getNutritionAnalysis();

        if (!response) {
          throw new Error(
            "No nutrition analysis was returned."
          );
        }

        /*
         * Supports either:
         *
         * {
         *   data: {...},
         *   generatedAt: "..."
         * }
         *
         * OR a direct analysis object.
         */

        if ("data" in response) {
          setAnalysis(
            response.data
          );

          setGeneratedAt(
            response.generatedAt ??
              null
          );
        } else {
          setAnalysis(
            response as NutritionAnalysis
          );

          setGeneratedAt(null);
        }
      } catch (error) {
        console.error(
          "Dashboard load failed:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [mounted]);

  // -----------------------------------
  // Hydration-safe first render
  // -----------------------------------

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <DashboardLoader />
      </main>
    );
  }

  // -----------------------------------
  // Loading
  // -----------------------------------

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <DashboardLoader />
      </main>
    );
  }

  // -----------------------------------
  // Error
  // -----------------------------------

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center shadow-xl">
          <div className="mb-4 text-4xl">
            ⚠️
          </div>

          <h2 className="text-2xl font-bold">
            Dashboard unavailable
          </h2>

          <p className="mt-3 text-sm text-red-300">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-lg bg-white px-5 py-2.5 font-medium text-slate-900 transition hover:bg-slate-200"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // -----------------------------------
  // No analysis
  // -----------------------------------

  if (!analysis) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h2 className="text-xl font-semibold">
            No analysis available
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Upload or update All_Diets.csv
            so the Blob Trigger can prepare
            the dashboard data.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* =========================
          HEADER
      ========================== */}

      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
              Azure Nutrition Analytics
            </p>

            <h1 className="mt-1 text-3xl font-bold md:text-4xl">
              Nutritional Insights Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden text-right sm:block">
                <p className="text-sm text-slate-400">
                  Logged in as
                </p>

                <p className="font-semibold text-white">
                  {user.name}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:border-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* =========================
          DASHBOARD BODY
      ========================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Processing information */}

        <div className="mb-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">
              Dashboard results are read
              from the precomputed Azure
              data store. The CSV is not
              recalculated every time this
              page loads.
            </p>

            {generatedAt && (
              <p className="text-xs text-emerald-300">
                Last processed:{" "}
                {formatGeneratedDate(
                  generatedAt
                )}
              </p>
            )}
          </div>
        </div>

        {/* =========================
            SUMMARY
        ========================== */}

        {analysis.summary && (
          <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(
              analysis.summary
            ).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <p className="text-sm capitalize text-slate-400">
                    {formatLabel(key)}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-white">
                    {formatValue(value)}
                  </p>
                </div>
              )
            )}
          </section>
        )}

        {/* =========================
            CHARTS
        ========================== */}

        <section className="grid gap-6 lg:grid-cols-2">
          {/* Calories by diet */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <h2 className="mb-5 text-lg font-semibold">
              Calories by Diet
            </h2>

            <CaloriesBar
              data={
                analysis.byDiet ?? []
              }
            />
          </div>

          {/* Calories distribution */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <h2 className="mb-5 text-lg font-semibold">
              Calories Distribution
            </h2>

            <CaloriesPie
              data={
                analysis.caloriesPie ??
                []
              }
            />
          </div>

          {/* Heatmap */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <h2 className="mb-5 text-lg font-semibold">
              Nutrient Correlation
            </h2>

            <NutrientHeatmap
              data={
                analysis.heatmap ??
                []
              }
            />
          </div>

          {/* Scatter */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <h2 className="mb-5 text-lg font-semibold">
              Protein vs Calories
            </h2>

            <ProteinCaloriesScatter
              data={
                analysis.scatter ??
                []
              }
            />
          </div>
        </section>

        {/* =========================
            RECIPE SEARCH
        ========================== */}

        <section className="mt-10">
          <RecipeSearch />
        </section>
      </div>
    </main>
  );
}

/* =====================================
   LOADING COMPONENT
===================================== */

function DashboardLoader() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400" />

      <p className="text-slate-300">
        Loading nutritional analytics...
      </p>
    </div>
  );
}

/* =====================================
   HELPER FUNCTIONS
===================================== */

function formatGeneratedDate(
  value: string
) {
  try {
    return new Date(
      value
    ).toLocaleString();
  } catch {
    return value;
  }
}

function formatLabel(
  value: string
) {
  return value
    .replace(/_/g, " ")
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    );
}

function formatValue(
  value: unknown
) {
  if (
    typeof value === "number"
  ) {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toFixed(2);
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return String(value);
}
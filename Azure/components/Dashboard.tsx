"use client"; 

import {
  useEffect,
  useState,
} from "react";
import {
  NutritionAnalysis,
} from "@/types/nutrition";
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
  ] =
    useState<NutritionAnalysis | null>(
      null
    );

  const [
    generatedAt,
    setGeneratedAt,
  ] =
    useState<string | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response =
          await getNutritionAnalysis();

        if (response) {
          setAnalysis(
            response.data
          );

          setGeneratedAt(
            response.generatedAt ||
              null
          );
        }
      } catch (error) {
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
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400" />

          <p className="text-slate-300">
            Loading nutritional analytics...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="max-w-lg rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <h1 className="text-xl font-bold text-white">
            Dashboard unavailable
          </h1>

          <p className="mt-3 text-red-300">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-lg bg-white px-5 py-2 font-medium text-slate-900"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">
              Azure Nutrition Analytics
            </p>

            <h1 className="mt-1 text-3xl font-bold md:text-4xl">
              Nutritional Insights Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm text-slate-400">
                Logged in as
              </p>

              <p className="font-semibold text-white">
                {user?.name}
              </p>
            </div>

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

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">
              Dashboard results are served from the prepared Azure data store rather than recalculating the CSV on every request.
            </p>

            {generatedAt && (
              <p className="text-xs text-emerald-300">
                Last processed:{" "}
                {new Date(
                  generatedAt
                ).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Keep your existing summary cards here. */}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-5 text-lg font-semibold">
              Calories by Diet
            </h2>

            <CaloriesBar
              data={analysis.byDiet}
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-5 text-lg font-semibold">
              Calories Distribution
            </h2>

            <CaloriesPie
              data={
                analysis.caloriesPie
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-5 text-lg font-semibold">
              Nutrient Correlation
            </h2>

            <NutrientHeatmap
              data={
                analysis.heatmap
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-5 text-lg font-semibold">
              Protein vs Calories
            </h2>

            <ProteinCaloriesScatter
              data={
                analysis.scatter
              }
            />
          </div>
        </section>

        <RecipeSearch />
      </div>
    </main>
  );
}

async function getNutritionAnalysis(): Promise<{
  data: NutritionAnalysis;
  generatedAt?: string;
} | null> {
  // TODO: replace this stub with a real API call.
  return null;
}

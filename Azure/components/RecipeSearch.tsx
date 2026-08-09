"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { getRecipes } from "@/services/nutritionApi";

import type {
  Recipe,
} from "@/types/nutrition";

import Pagination from "./Pagination";
import RecipeTable from "./RecipeTable";


const PAGE_SIZE = 10;

const DIET_TYPES = [
  "",
  "Keto",
  "Mediterranean",
  "Paleo",
  "Vegan",
  "Dash",
];


export default function RecipeSearch() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const [diet, setDiet] = useState("");

  // What the user is currently typing.
  const [searchInput, setSearchInput] =
    useState("");

  // Actual search sent to the API.
  const [search, setSearch] =
    useState("");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [totalItems, setTotalItems] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRecipes({
          diet,
          q: search,
          page,
          pageSize: PAGE_SIZE,
        });

        setRecipes(data.items ?? []);
        setTotalPages(
          data.totalPages > 0
            ? data.totalPages
            : 1
        );

        setTotalItems(
          data.totalItems ?? 0
        );
      } catch (err) {
        console.error(
          "Recipe request failed:",
          err
        );

        setRecipes([]);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load recipes."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [
    diet,
    search,
    page,
  ]);


  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPage(1);

    setSearch(
      searchInput.trim()
    );
  };


  const handleDietChange = (
    value: string
  ) => {
    setDiet(value);
    setPage(1);
  };


  const handleClear = () => {
    setSearchInput("");
    setSearch("");
    setDiet("");
    setPage(1);
  };


  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Recipe Search
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Search and filter recipes stored in
          Cosmos DB.
        </p>
      </div>


      {/* Search controls */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-[1fr_220px_auto]"
        >
          {/* Search */}
          <div>
            <label
              htmlFor="recipe-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Search recipes
            </label>

            <input
              id="recipe-search"
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="e.g. chicken"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-500"
            />
          </div>


          {/* Diet */}
          <div>
            <label
              htmlFor="diet-filter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Diet type
            </label>

            <select
              id="diet-filter"
              value={diet}
              onChange={(event) =>
                handleDietChange(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-500"
            >
              {DIET_TYPES.map((type) => (
                <option
                  key={type || "all"}
                  value={type}
                >
                  {type || "All diets"}
                </option>
              ))}
            </select>
          </div>


          {/* Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </form>
      </div>


      {/* Result summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {loading
            ? "Loading..."
            : `${totalItems} recipe${
                totalItems === 1
                  ? ""
                  : "s"
              } found`}
        </p>

        {(diet || search) && (
          <p className="text-sm text-gray-500">
            {diet && (
              <>
                Diet:{" "}
                <span className="font-medium">
                  {diet}
                </span>
              </>
            )}

            {diet && search && " • "}

            {search && (
              <>
                Search:{" "}
                <span className="font-medium">
                  {search}
                </span>
              </>
            )}
          </p>
        )}
      </div>


      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}


      {/* Recipe results */}
      {!error && (
        <RecipeTable
          recipes={recipes}
          loading={loading}
        />
      )}


      {/* Pagination */}
      {!loading &&
        !error &&
        recipes.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
    </section>
  );
}
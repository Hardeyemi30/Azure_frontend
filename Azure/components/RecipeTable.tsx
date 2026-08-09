"use client";

import type { Recipe } from "@/types/nutrition";

interface RecipeTableProps {
  recipes: Recipe[];
  loading?: boolean;
}

export default function RecipeTable({
  recipes,
  loading = false,
}: RecipeTableProps) {
  if (loading) {
    return (
      <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-gray-200 bg-white">
        <p className="text-sm text-gray-500">
          Loading recipes...
        </p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-gray-200 bg-white">
        <div className="text-center">
          <h3 className="font-semibold text-gray-800">
            No recipes found
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Try changing your search or diet filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Recipe
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Diet
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Cuisine
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Protein
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Carbs
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Fat
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {recipes.map((recipe) => (
              <tr
                key={recipe.id}
                className="transition hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-5 py-4">
                  <div className="font-medium text-gray-900">
                    {recipe.recipe_name}
                  </div>
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {recipe.diet_type}
                  </span>
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                  {recipe.cuisine}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                  {Number(recipe.protein).toFixed(1)} g
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                  {Number(recipe.carbohydrates).toFixed(1)} g
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                  {Number(recipe.fat).toFixed(1)} g
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
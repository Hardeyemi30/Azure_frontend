// lib/recipes.ts

export type Recipe = {
  id: string;
  recipe_name: string;
  diet_type: string;
  cuisine: string;
  protein: number;
  carbohydrates: number;
  fat: number;
};

export type RecipesResponse = {
  success: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: Recipe[];
};

export async function fetchRecipes({
  diet = "",
  q = "",
  page = 1,
  pageSize = 10,
}: {
  diet?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();

  if (diet) params.set("diet", diet);
  if (q) params.set("q", q);

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  const response = await fetch(
    `http://localhost:7071/api/recipes?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to load recipes");
  }

  return (await response.json()) as RecipesResponse;
}
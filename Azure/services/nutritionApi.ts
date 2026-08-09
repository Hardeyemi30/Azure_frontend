import {
  RecipeQueryParams,
  RecipesResponse,
} from "@/types/nutrition";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:7071/api";


export async function getRecipes({
  diet = "",
  q = "",
  page = 1,
  pageSize = 10,
}: RecipeQueryParams = {}): Promise<RecipesResponse> {
  const params = new URLSearchParams();

  if (diet.trim()) {
    params.set("diet", diet.trim());
  }

  if (q.trim()) {
    params.set("q", q.trim());
  }

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  const url = `${API_BASE_URL}/recipes?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Failed to fetch recipes.";

    try {
      const errorData = await response.json();

      if (errorData?.error) {
        message = errorData.error;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}
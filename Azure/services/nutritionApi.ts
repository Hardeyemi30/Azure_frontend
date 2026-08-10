import type {
  NutritionAnalysis,
  Recipe,
} from "@/types/nutrition";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:7071/api";

export interface NutritionAnalysisResponse {
  data: NutritionAnalysis;
  generatedAt?: string;
}

export interface RecipesResponse {
  success: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: Recipe[];
}

export interface GetRecipesParams {
  diet?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

/* =========================
   GET NUTRITION ANALYSIS
========================= */

export async function getNutritionAnalysis(): Promise<NutritionAnalysisResponse> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const response = await fetch(
    `${API_BASE_URL}/nutrition-analysis`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },

      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
        "Unable to load nutrition analysis."
    );
  }

  if (result.data) {
    return {
      data: result.data,
      generatedAt: result.generatedAt,
    };
  }

  return {
    data: result,
    generatedAt: result.generatedAt,
  };
}

/* =========================
   GET RECIPES
========================= */

export async function getRecipes({
  diet = "",
  q = "",
  page = 1,
  pageSize = 10,
}: GetRecipesParams = {}): Promise<RecipesResponse> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const params = new URLSearchParams();

  if (diet.trim()) {
    params.set(
      "diet",
      diet.trim()
    );
  }

  if (q.trim()) {
    params.set(
      "q",
      q.trim()
    );
  }

  params.set(
    "page",
    String(page)
  );

  params.set(
    "pageSize",
    String(pageSize)
  );

  const response = await fetch(
    `${API_BASE_URL}/recipes?${params.toString()}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },

      cache: "no-store",
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
        "Unable to load recipes."
    );
  }

  return result;
}
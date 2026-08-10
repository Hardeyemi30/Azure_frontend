export interface NutritionSummary {
  totalRecipes: number;
  averageCalories: number;
  averageProtein: number;
  averageCarbohydrates: number;
  averageFat: number;
}

export interface DietAnalysis {
  diet: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface ScatterPoint {
  food: string;
  diet_type: string;
  cuisine: string;
  x: number;
  y: number;
}

export interface HeatmapItem {
  x: string;
  y: string;
  value: number;
}

export interface CaloriesPieItem {
  name: string;
  value: number;
}

export interface NutritionAnalysis {
  summary: NutritionSummary;
  byDiet: DietAnalysis[];
  scatter: ScatterPoint[];
  heatmap: HeatmapItem[];
  caloriesPie: CaloriesPieItem[];
}

export interface NutritionApiResponse {
  success: boolean;
  message?: string;
  generatedAt?: string;
  data: NutritionAnalysis;
}

export interface Recipe {
  id: string;
  recipe_name: string;
  diet_type: string;
  cuisine: string;
  protein: number;
  carbohydrates: number;
  fat: number;
  dataset_version?: string;
}

export interface RecipesResponse {
  success: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: Recipe[];
}

export interface RecipeQueryParams {
  diet?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

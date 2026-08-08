export interface DonenessDetail {
  level: string;
  temp: string;
  color: string;
  desc: string;
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  meatType: "meat" | "chicken";
  cuisine: "arabic" | "international";
  description: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  videoPlaceholder: string;
  videoUrl?: string;
  icon?: string;
  imageUrl?: string;
  ingredients: string[];
  instructions: string[];
  tips: string[];
  marinade: string;
  doneness?: DonenessDetail[];
}

// Default recipes are empty — user will add custom recipes for the 18 products
export const recipes: Record<string, Recipe> = {};

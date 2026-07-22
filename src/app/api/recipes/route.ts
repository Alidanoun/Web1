import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recipes as defaultRecipes } from "@/data/recipes";

// Helper to seed initial default recipes safely without deleting admin edits
async function seedDefaultRecipesIfEmpty() {
  for (const key of Object.keys(defaultRecipes)) {
    const r = defaultRecipes[key];
    const existing = await prisma.recipe.findUnique({ where: { id: r.id } });
    if (!existing) {
      await prisma.recipe.create({
        data: {
          id: r.id,
          title: r.title,
          category: r.category,
          cuisine: r.cuisine || "arabic",
          description: r.description,
          prepTime: r.prepTime,
          cookTime: r.cookTime,
          difficulty: r.difficulty,
          videoPlaceholder: r.videoPlaceholder,
          videoUrl: r.videoUrl || "",
          ingredients: JSON.stringify(r.ingredients),
          instructions: JSON.stringify(r.instructions),
          tips: JSON.stringify(r.tips),
          marinade: r.marinade,
          doneness: r.doneness ? JSON.stringify(r.doneness) : null,
        },
      });
    }
  }
}

// GET /api/recipes - Fetch all recipes
export async function GET() {
  try {
    await seedDefaultRecipesIfEmpty();

    const dbRecipes = await prisma.recipe.findMany();

    const formatted = dbRecipes.reduce((acc: Record<string, any>, r: any) => {
      acc[r.id] = {
        id: r.id,
        title: r.title,
        category: r.category,
        cuisine: r.cuisine || "arabic",
        description: r.description,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        difficulty: r.difficulty,
        videoPlaceholder: r.videoPlaceholder,
        videoUrl: r.videoUrl,
        ingredients: JSON.parse(r.ingredients || "[]"),
        instructions: JSON.parse(r.instructions || "[]"),
        tips: JSON.parse(r.tips || "[]"),
        marinade: r.marinade,
        doneness: r.doneness ? JSON.parse(r.doneness) : undefined,
        recommendedWeights: r.recommendedWeights ? JSON.parse(r.recommendedWeights) : {
          "group-1": "",
          "group-2": "",
          "group-3": "",
          "group-4": "",
          "group-5": ""
        },
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ success: true, recipes: formatted }, { status: 200 });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return NextResponse.json({ error: "فشل جلب الوصفات" }, { status: 500 });
  }
}

// PUT /api/recipes - Update a recipe & its video & cuisine
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, category, cuisine, description, prepTime, cookTime, difficulty, videoUrl, ingredients, instructions, tips, marinade, recommendedWeights } = body;

    if (!id || !title) {
      return NextResponse.json({ error: "معرف الوصفة والعنوان مطلوبان" }, { status: 400 });
    }

    const updated = await prisma.recipe.upsert({
      where: { id },
      update: {
        title,
        category: category || id,
        cuisine: cuisine || "arabic",
        description,
        prepTime,
        cookTime,
        difficulty,
        videoUrl: videoUrl || "",
        ingredients: (typeof ingredients === "object" && ingredients !== null) ? JSON.stringify(ingredients) : JSON.stringify([]),
        instructions: Array.isArray(instructions) ? JSON.stringify(instructions) : JSON.stringify([]),
        tips: Array.isArray(tips) ? JSON.stringify(tips) : JSON.stringify([]),
        marinade,
        recommendedWeights: recommendedWeights ? JSON.stringify(recommendedWeights) : null,
      },
      create: {
        id,
        title,
        category: category || id,
        cuisine: cuisine || "arabic",
        description,
        prepTime: prepTime || "15 دقيقة",
        cookTime: cookTime || "10 دقائق",
        difficulty: difficulty || "سهل",
        videoPlaceholder: "شاهد فيديو الوصفة",
        videoUrl: videoUrl || "",
        ingredients: (typeof ingredients === "object" && ingredients !== null) ? JSON.stringify(ingredients) : JSON.stringify([]),
        instructions: Array.isArray(instructions) ? JSON.stringify(instructions) : JSON.stringify([]),
        tips: Array.isArray(tips) ? JSON.stringify(tips) : JSON.stringify([]),
        marinade: marinade || "",
        recommendedWeights: recommendedWeights ? JSON.stringify(recommendedWeights) : null,
      },
    });

    return NextResponse.json({ success: true, recipe: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating recipe:", error);
    return NextResponse.json({ error: "فشل تحديث الوصفة" }, { status: 500 });
  }
}

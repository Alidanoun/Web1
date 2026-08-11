import { NextResponse } from "next/server";
import { prisma, ensureTablesExist, runQuery } from "@/lib/db";
import { recipes as staticRecipes } from "@/data/recipes";

// GET /api/recipes - Fetch all recipes from DB (or fallback to static data)
export async function GET() {
  try {
    await ensureTablesExist();
    const dbRecipes = await prisma.recipe.findMany();
    if (dbRecipes && dbRecipes.length > 0) {
      const formatted = dbRecipes.reduce((acc: Record<string, any>, r: any) => {
        acc[r.id] = {
          id: r.id,
          title: r.title,
          category: r.category,
          productId: r.productId || "",
          icon: r.icon || "",
          imageUrl: r.imageUrl || "",
          meatType: r.meatType || "meat",
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
        };
        return acc;
      }, {} as Record<string, any>);
      return NextResponse.json({ success: true, recipes: formatted }, { status: 200 });
    }

    return NextResponse.json({ success: true, recipes: staticRecipes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return NextResponse.json({ success: true, recipes: staticRecipes }, { status: 200 });
  }
}

// PUT /api/recipes - Create or Update a recipe
export async function PUT(req: Request) {
  try {
    await ensureTablesExist();
    const body = await req.json();
    const { id, title, category, productId, icon, imageUrl, meatType, cuisine, description, prepTime, cookTime, difficulty, videoUrl, ingredients, instructions, tips, marinade } = body;

    if (!id || !title) {
      return NextResponse.json({ error: "معرف الوصفة والعنوان مطلوبان" }, { status: 400 });
    }

    const cleanId = id.trim().toLowerCase().replace(/\s+/g, "_");

    const updated = await prisma.recipe.upsert({
      where: { id: cleanId },
      update: {
        title,
        category: category || cleanId,
        productId: productId || "",
        icon: icon || "",
        imageUrl: imageUrl || "",
        meatType: meatType === "chicken" ? "chicken" : "meat",
        cuisine: cuisine || "arabic",
        description: description || "",
        prepTime: prepTime || "15 دقيقة",
        cookTime: cookTime || "10 دقائق",
        difficulty: difficulty || "سهل",
        videoUrl: videoUrl || "",
        ingredients: Array.isArray(ingredients) ? JSON.stringify(ingredients) : (typeof ingredients === "string" ? JSON.stringify(ingredients.split("\n").filter(Boolean)) : JSON.stringify([])),
        instructions: Array.isArray(instructions) ? JSON.stringify(instructions) : (typeof instructions === "string" ? JSON.stringify(instructions.split("\n").filter(Boolean)) : JSON.stringify([])),
        tips: Array.isArray(tips) ? JSON.stringify(tips) : (typeof tips === "string" ? JSON.stringify(tips.split("\n").filter(Boolean)) : JSON.stringify([])),
        marinade: marinade || "",
      },
      create: {
        id: cleanId,
        title,
        category: category || cleanId,
        productId: productId || "",
        icon: icon || "",
        imageUrl: imageUrl || "",
        meatType: meatType === "chicken" ? "chicken" : "meat",
        cuisine: cuisine || "arabic",
        description: description || "",
        prepTime: prepTime || "15 دقيقة",
        cookTime: cookTime || "10 دقائق",
        difficulty: difficulty || "سهل",
        videoPlaceholder: "شاهد فيديو الوصفة",
        videoUrl: videoUrl || "",
        ingredients: Array.isArray(ingredients) ? JSON.stringify(ingredients) : (typeof ingredients === "string" ? JSON.stringify(ingredients.split("\n").filter(Boolean)) : JSON.stringify([])),
        instructions: Array.isArray(instructions) ? JSON.stringify(instructions) : (typeof instructions === "string" ? JSON.stringify(instructions.split("\n").filter(Boolean)) : JSON.stringify([])),
        tips: Array.isArray(tips) ? JSON.stringify(tips) : (typeof tips === "string" ? JSON.stringify(tips.split("\n").filter(Boolean)) : JSON.stringify([])),
        marinade: marinade || "",
      },
    });

    return NextResponse.json({ success: true, recipe: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating recipe:", error);
    return NextResponse.json({ error: "فشل حفظ أو تحديث الوصفة" }, { status: 500 });
  }
}

// DELETE /api/recipes - Delete a recipe by ID
export async function DELETE(req: Request) {
  try {
    await ensureTablesExist();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الوصفة مطلوب للحذف" }, { status: 400 });
    }

    await runQuery(`DELETE FROM "Recipe" WHERE "id"=$1`, [id]);
    return NextResponse.json({ success: true, message: "تم حذف الوصفة بنجاح" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return NextResponse.json({ error: "فشل حذف الوصفة" }, { status: 500 });
  }
}

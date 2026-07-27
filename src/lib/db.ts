import { PrismaClient } from '@prisma/client';

function getDbUrl() {
  let url = process.env.DATABASE_URL || '';
  if (url && (url.startsWith('postgres://') || url.startsWith('postgresql://'))) {
    if (!url.includes('sslmode=')) {
      url += url.includes('?') ? '&sslmode=require' : '?sslmode=require';
    }
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  initialized: boolean | undefined;
};

const dbUrl = getDbUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    dbUrl
      ? {
          datasources: {
            db: {
              url: dbUrl,
            },
          },
        }
      : undefined
  );

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function ensureTablesExist() {
  if (globalForPrisma.initialized) return;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Scan" (
        "id" TEXT PRIMARY KEY,
        "product" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Rating" (
        "id" TEXT PRIMARY KEY,
        "product" TEXT NOT NULL,
        "stars" INTEGER NOT NULL,
        "comment" TEXT DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Lead" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL DEFAULT '',
        "contact" TEXT NOT NULL,
        "promoCode" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrderClick" (
        "id" TEXT PRIMARY KEY,
        "product" TEXT NOT NULL,
        "platform" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Recipe" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "meatType" TEXT NOT NULL DEFAULT 'meat',
        "cuisine" TEXT NOT NULL DEFAULT 'arabic',
        "description" TEXT NOT NULL,
        "prepTime" TEXT NOT NULL,
        "cookTime" TEXT NOT NULL,
        "difficulty" TEXT NOT NULL,
        "videoUrl" TEXT NOT NULL DEFAULT '',
        "videoPlaceholder" TEXT NOT NULL DEFAULT '',
        "ingredients" TEXT NOT NULL,
        "instructions" TEXT NOT NULL,
        "tips" TEXT NOT NULL,
        "marinade" TEXT NOT NULL,
        "doneness" TEXT,
        "recommendedWeights" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "meatType" TEXT DEFAULT 'meat';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "icon" TEXT DEFAULT '';`);
    } catch (e) {
      // Column already exists
    }

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Package" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL DEFAULT '',
        "kebab" TEXT NOT NULL DEFAULT '',
        "ribs" TEXT NOT NULL DEFAULT '',
        "burger" TEXT NOT NULL DEFAULT '',
        "steak" TEXT NOT NULL DEFAULT '',
        "notes" TEXT NOT NULL DEFAULT '',
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SiteSetting" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // LoyaltyCard — stores points per phone number
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LoyaltyCard" (
        "id" TEXT PRIMARY KEY,
        "phone" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL DEFAULT '',
        "points" INTEGER NOT NULL DEFAULT 0,
        "totalEarned" INTEGER NOT NULL DEFAULT 0,
        "rewardCode" TEXT NOT NULL DEFAULT '',
        "rewardUsed" BOOLEAN NOT NULL DEFAULT false,
        "lastScanAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    globalForPrisma.initialized = true;
    console.log("DB Tables ensured successfully.");
  } catch (err) {
    console.error("Error ensuring DB tables:", err);
  }
}

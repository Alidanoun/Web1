/**
 * db.ts — Neon Serverless SQL client
 * Works natively in Cloudflare Workers & Pages without any engine/wasm issues.
 * Prisma is kept only as a type reference for the schema models.
 */
import { neon, neonConfig } from "@neondatabase/serverless";

// Enable connection pooling-friendly mode for edge environments
neonConfig.fetchConnectionCache = true;

function getDbUrl(): string {
  const url = process.env.DATABASE_URL || "";
  return url;
}

// Lazy-initialised SQL client — created once per Worker instance
let _sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!_sql) {
    const url = getDbUrl();
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Go to Cloudflare Pages → Settings → Environment Variables and add DATABASE_URL."
      );
    }
    _sql = neon(url);
  }
  return _sql;
}

// ─── Table bootstrap ──────────────────────────────────────────────────────────
let _tablesEnsured = false;

export async function ensureTablesExist() {
  if (_tablesEnsured) return;

  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS "Scan" (
      "id"        TEXT PRIMARY KEY,
      "product"   TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Rating" (
      "id"        TEXT PRIMARY KEY,
      "product"   TEXT NOT NULL,
      "stars"     INTEGER NOT NULL,
      "comment"   TEXT DEFAULT '',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Lead" (
      "id"        TEXT PRIMARY KEY,
      "name"      TEXT NOT NULL DEFAULT '',
      "contact"   TEXT NOT NULL,
      "promoCode" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS "OrderClick" (
      "id"        TEXT PRIMARY KEY,
      "product"   TEXT NOT NULL,
      "platform"  TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Recipe" (
      "id"                 TEXT PRIMARY KEY,
      "title"              TEXT NOT NULL,
      "category"           TEXT NOT NULL,
      "icon"               TEXT NOT NULL DEFAULT '',
      "meatType"           TEXT NOT NULL DEFAULT 'meat',
      "cuisine"            TEXT NOT NULL DEFAULT 'arabic',
      "description"        TEXT NOT NULL DEFAULT '',
      "prepTime"           TEXT NOT NULL DEFAULT '',
      "cookTime"           TEXT NOT NULL DEFAULT '',
      "difficulty"         TEXT NOT NULL DEFAULT '',
      "videoUrl"           TEXT NOT NULL DEFAULT '',
      "videoPlaceholder"   TEXT NOT NULL DEFAULT '',
      "ingredients"        TEXT NOT NULL DEFAULT '[]',
      "instructions"       TEXT NOT NULL DEFAULT '[]',
      "tips"               TEXT NOT NULL DEFAULT '[]',
      "marinade"           TEXT NOT NULL DEFAULT '',
      "doneness"           TEXT,
      "recommendedWeights" TEXT,
      "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Package" (
      "id"          TEXT PRIMARY KEY,
      "name"        TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "kebab"       TEXT NOT NULL DEFAULT '',
      "ribs"        TEXT NOT NULL DEFAULT '',
      "burger"      TEXT NOT NULL DEFAULT '',
      "steak"       TEXT NOT NULL DEFAULT '',
      "notes"       TEXT NOT NULL DEFAULT '',
      "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS "SiteSetting" (
      "key"       TEXT PRIMARY KEY,
      "value"     TEXT NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS "LoyaltyCard" (
      "id"          TEXT PRIMARY KEY,
      "phone"       TEXT NOT NULL UNIQUE,
      "name"        TEXT NOT NULL DEFAULT '',
      "points"      INTEGER NOT NULL DEFAULT 0,
      "totalEarned" INTEGER NOT NULL DEFAULT 0,
      "rewardCode"  TEXT NOT NULL DEFAULT '',
      "rewardUsed"  BOOLEAN NOT NULL DEFAULT false,
      "lastScanAt"  TIMESTAMPTZ,
      "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

  _tablesEnsured = true;
}

// ─── Typed query helpers ───────────────────────────────────────────────────────

export async function dbQuery<T = any>(
  query: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  const sql = getSql();
  return sql(query, ...values) as Promise<T[]>;
}

// Keep a thin "prisma" compatibility shim so we don't break all existing API routes at once
// This wraps Neon SQL in a Prisma-like interface
export const prisma = {
  // ── Scan ──────────────────────────────────────────────────────────────────
  scan: {
    create: async ({ data }: { data: { id: string; product: string } }) => {
      const sql = getSql();
      await sql`INSERT INTO "Scan" ("id","product") VALUES (${data.id},${data.product}) ON CONFLICT ("id") DO NOTHING`;
      return data;
    },
    findMany: async (opts?: { orderBy?: any }) => {
      const sql = getSql();
      return sql`SELECT * FROM "Scan" ORDER BY "createdAt" DESC` as Promise<any[]>;
    },
  },

  // ── Rating ────────────────────────────────────────────────────────────────
  rating: {
    create: async ({ data }: { data: { id: string; product: string; stars: number; comment?: string } }) => {
      const sql = getSql();
      await sql`INSERT INTO "Rating" ("id","product","stars","comment") VALUES (${data.id},${data.product},${data.stars},${data.comment || ""}) ON CONFLICT ("id") DO NOTHING`;
      return data;
    },
    findMany: async (opts?: any) => {
      const sql = getSql();
      return sql`SELECT * FROM "Rating" ORDER BY "createdAt" DESC` as Promise<any[]>;
    },
  },

  // ── Lead ──────────────────────────────────────────────────────────────────
  lead: {
    create: async ({ data }: { data: { id: string; name: string; contact: string; promoCode: string } }) => {
      const sql = getSql();
      await sql`INSERT INTO "Lead" ("id","name","contact","promoCode") VALUES (${data.id},${data.name},${data.contact},${data.promoCode}) ON CONFLICT ("id") DO NOTHING`;
      return data;
    },
    findMany: async (opts?: any) => {
      const sql = getSql();
      return sql`SELECT * FROM "Lead" ORDER BY "createdAt" DESC` as Promise<any[]>;
    },
    findFirst: async ({ where }: { where: { contact: string } }) => {
      const sql = getSql();
      const rows = await sql`SELECT * FROM "Lead" WHERE "contact"=${where.contact} LIMIT 1`;
      return rows[0] ?? null;
    },
  },

  // ── OrderClick ────────────────────────────────────────────────────────────
  orderClick: {
    create: async ({ data }: { data: { id: string; product: string; platform: string } }) => {
      const sql = getSql();
      await sql`INSERT INTO "OrderClick" ("id","product","platform") VALUES (${data.id},${data.product},${data.platform}) ON CONFLICT ("id") DO NOTHING`;
      return data;
    },
    findMany: async (opts?: any) => {
      const sql = getSql();
      return sql`SELECT * FROM "OrderClick" ORDER BY "createdAt" DESC` as Promise<any[]>;
    },
  },

  // ── Recipe ────────────────────────────────────────────────────────────────
  recipe: {
    findMany: async () => {
      const sql = getSql();
      return sql`SELECT * FROM "Recipe" ORDER BY "updatedAt" DESC` as Promise<any[]>;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const sql = getSql();
      const rows = await sql`SELECT * FROM "Recipe" WHERE "id"=${where.id} LIMIT 1`;
      return rows[0] ?? null;
    },
    create: async ({ data }: { data: any }) => {
      const sql = getSql();
      await sql`
        INSERT INTO "Recipe" ("id","title","category","icon","meatType","cuisine","description","prepTime","cookTime","difficulty","videoUrl","videoPlaceholder","ingredients","instructions","tips","marinade","doneness","recommendedWeights")
        VALUES (${data.id},${data.title},${data.category},${data.icon||""},${data.meatType||"meat"},${data.cuisine||"arabic"},${data.description||""},${data.prepTime||""},${data.cookTime||""},${data.difficulty||""},${data.videoUrl||""},${data.videoPlaceholder||""},${data.ingredients||"[]"},${data.instructions||"[]"},${data.tips||"[]"},${data.marinade||""},${data.doneness||null},${data.recommendedWeights||null})
        ON CONFLICT ("id") DO NOTHING`;
      return data;
    },
    upsert: async ({ where, update, create }: any) => {
      const sql = getSql();
      const d = { ...create, ...update };
      await sql`
        INSERT INTO "Recipe" ("id","title","category","icon","meatType","cuisine","description","prepTime","cookTime","difficulty","videoUrl","videoPlaceholder","ingredients","instructions","tips","marinade","doneness","recommendedWeights")
        VALUES (${where.id},${d.title},${d.category||""},${d.icon||""},${d.meatType||"meat"},${d.cuisine||"arabic"},${d.description||""},${d.prepTime||""},${d.cookTime||""},${d.difficulty||""},${d.videoUrl||""},${d.videoPlaceholder||"شاهد الفيديو"},${d.ingredients||"[]"},${d.instructions||"[]"},${d.tips||"[]"},${d.marinade||""},${d.doneness||null},${d.recommendedWeights||null})
        ON CONFLICT ("id") DO UPDATE SET
          "title"=${d.title},"category"=${d.category||""},"icon"=${d.icon||""},"meatType"=${d.meatType||"meat"},
          "cuisine"=${d.cuisine||"arabic"},"description"=${d.description||""},"prepTime"=${d.prepTime||""},
          "cookTime"=${d.cookTime||""},"difficulty"=${d.difficulty||""},"videoUrl"=${d.videoUrl||""},
          "ingredients"=${d.ingredients||"[]"},"instructions"=${d.instructions||"[]"},"tips"=${d.tips||"[]"},
          "marinade"=${d.marinade||""},"doneness"=${d.doneness||null},"recommendedWeights"=${d.recommendedWeights||null},
          "updatedAt"=NOW()`;
      return { id: where.id, ...d };
    },
  },

  // ── SiteSetting ───────────────────────────────────────────────────────────
  siteSetting: {
    findMany: async () => {
      const sql = getSql();
      return sql`SELECT * FROM "SiteSetting"` as Promise<any[]>;
    },
    upsert: async ({ where, update, create }: any) => {
      const sql = getSql();
      await sql`
        INSERT INTO "SiteSetting" ("key","value") VALUES (${where.key},${create.value})
        ON CONFLICT ("key") DO UPDATE SET "value"=${update.value},"updatedAt"=NOW()`;
      return { key: where.key, value: update.value };
    },
  },

  // ── LoyaltyCard ───────────────────────────────────────────────────────────
  loyaltyCard: {
    findUnique: async ({ where }: { where: { phone: string } }) => {
      const sql = getSql();
      const rows = await sql`SELECT * FROM "LoyaltyCard" WHERE "phone"=${where.phone} LIMIT 1`;
      return rows[0] ?? null;
    },
  },

  // ── Raw queries (used by loyalty route) ───────────────────────────────────
  $executeRawUnsafe: async (query: string, ...params: any[]) => {
    const sql = getSql();
    // Use tagged template for raw unsafe — build manually
    const result = await sql.transaction((tx: any) => [tx(query as any, ...params)]);
    return result;
  },

  $queryRawUnsafe: async <T = any>(query: string, ...params: any[]): Promise<T[]> => {
    const sql = getSql();
    return sql(query as any, ...params) as unknown as T[];
  },
};

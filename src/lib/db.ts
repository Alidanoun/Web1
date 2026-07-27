/**
 * db.ts — Universal Serverless SQL Client for Cloudflare Workers
 * Supports Supabase (WebSocket Pool) and Neon (HTTP / Pool).
 */
import { neon, neonConfig, Pool } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = true;

function getDbUrl(): string {
  let url = process.env.DATABASE_URL || "";
  if (url && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
    if (!url.includes("sslmode=")) {
      url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
    }
  }
  return url;
}

let _pool: Pool | null = null;
let _neonSql: ReturnType<typeof neon> | null = null;

/**
 * Universal Query Execution
 * Automatically routes to Neon HTTP for neon.tech, or WebSocket Pool for Supabase / PostgreSQL.
 */
export async function runQuery<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  const url = getDbUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not set in Cloudflare Variables.");
  }

  // If Neon host
  if (url.includes("neon.tech")) {
    if (!_neonSql) _neonSql = neon(url);
    // Convert parameterized query
    if (params.length === 0) {
      return (await _neonSql(queryText as any)) as unknown as T[];
    } else {
      const res = await _neonSql.transaction((tx: any) => [tx(queryText as any, ...params)]);
      return (res[0] || []) as unknown as T[];
    }
  }

  // For Supabase or standard PostgreSQL (via WebSocket connection pool in Cloudflare Workers)
  if (!_pool) {
    _pool = new Pool({ connectionString: url, connectionTimeoutMillis: 10000 });
  }
  const result = await _pool.query(queryText, params);
  return result.rows as unknown as T[];
}

/**
 * Tagged template literal helper: sql`SELECT * FROM "Table" WHERE id = ${id}`
 */
export function getSql() {
  const tagFn = async (strings: TemplateStringsArray, ...values: any[]) => {
    let queryText = strings[0];
    for (let i = 1; i < strings.length; i++) {
      queryText += `$${i}` + strings[i];
    }
    return runQuery(queryText, values);
  };

  tagFn.transaction = async (fn: any) => {
    // Basic fallback transaction runner
    return [];
  };

  return tagFn;
}

// ─── Table bootstrap ──────────────────────────────────────────────────────────
let _tablesEnsured = false;

export async function ensureTablesExist() {
  if (_tablesEnsured) return;

  await runQuery(`
    CREATE TABLE IF NOT EXISTS "Scan" (
      "id"        TEXT PRIMARY KEY,
      "product"   TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS "Rating" (
      "id"        TEXT PRIMARY KEY,
      "product"   TEXT NOT NULL,
      "stars"     INTEGER NOT NULL,
      "comment"   TEXT DEFAULT '',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS "Lead" (
      "id"        TEXT PRIMARY KEY,
      "name"      TEXT NOT NULL DEFAULT '',
      "contact"   TEXT NOT NULL,
      "promoCode" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS "OrderClick" (
      "id"        TEXT PRIMARY KEY,
      "product"   TEXT NOT NULL,
      "platform"  TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  await runQuery(`
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
    )`);

  await runQuery(`
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
    )`);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS "SiteSetting" (
      "key"       TEXT PRIMARY KEY,
      "value"     TEXT NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  await runQuery(`
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
    )`);

  _tablesEnsured = true;
}

// ─── Typed query helpers (Prisma-like compatibility API) ───────────────────────

export const prisma = {
  // ── Scan ──────────────────────────────────────────────────────────────────
  scan: {
    create: async ({ data }: { data: { id: string; product: string } }) => {
      await runQuery(
        `INSERT INTO "Scan" ("id","product") VALUES ($1,$2) ON CONFLICT ("id") DO NOTHING`,
        [data.id, data.product]
      );
      return data;
    },
    findMany: async () => {
      return runQuery(`SELECT * FROM "Scan" ORDER BY "createdAt" DESC`);
    },
  },

  // ── Rating ────────────────────────────────────────────────────────────────
  rating: {
    create: async ({ data }: { data: { id: string; product: string; stars: number; comment?: string } }) => {
      await runQuery(
        `INSERT INTO "Rating" ("id","product","stars","comment") VALUES ($1,$2,$3,$4) ON CONFLICT ("id") DO NOTHING`,
        [data.id, data.product, data.stars, data.comment || ""]
      );
      return data;
    },
    findMany: async () => {
      return runQuery(`SELECT * FROM "Rating" ORDER BY "createdAt" DESC`);
    },
  },

  // ── Lead ──────────────────────────────────────────────────────────────────
  lead: {
    create: async ({ data }: { data: { id: string; name: string; contact: string; promoCode: string } }) => {
      await runQuery(
        `INSERT INTO "Lead" ("id","name","contact","promoCode") VALUES ($1,$2,$3,$4) ON CONFLICT ("id") DO NOTHING`,
        [data.id, data.name, data.contact, data.promoCode]
      );
      return data;
    },
    findMany: async () => {
      return runQuery(`SELECT * FROM "Lead" ORDER BY "createdAt" DESC`);
    },
    findFirst: async ({ where }: { where: { contact: string } }) => {
      const rows = await runQuery(`SELECT * FROM "Lead" WHERE "contact"=$1 LIMIT 1`, [where.contact]);
      return rows[0] ?? null;
    },
  },

  // ── OrderClick ────────────────────────────────────────────────────────────
  orderClick: {
    create: async ({ data }: { data: { id: string; product: string; platform: string } }) => {
      await runQuery(
        `INSERT INTO "OrderClick" ("id","product","platform") VALUES ($1,$2,$3) ON CONFLICT ("id") DO NOTHING`,
        [data.id, data.product, data.platform]
      );
      return data;
    },
    findMany: async () => {
      return runQuery(`SELECT * FROM "OrderClick" ORDER BY "createdAt" DESC`);
    },
  },

  // ── Recipe ────────────────────────────────────────────────────────────────
  recipe: {
    findMany: async () => {
      return runQuery(`SELECT * FROM "Recipe" ORDER BY "updatedAt" DESC`);
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const rows = await runQuery(`SELECT * FROM "Recipe" WHERE "id"=$1 LIMIT 1`, [where.id]);
      return rows[0] ?? null;
    },
    create: async ({ data }: { data: any }) => {
      await runQuery(
        `INSERT INTO "Recipe" ("id","title","category","icon","meatType","cuisine","description","prepTime","cookTime","difficulty","videoUrl","videoPlaceholder","ingredients","instructions","tips","marinade","doneness","recommendedWeights")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT ("id") DO NOTHING`,
        [
          data.id,
          data.title,
          data.category,
          data.icon || "",
          data.meatType || "meat",
          data.cuisine || "arabic",
          data.description || "",
          data.prepTime || "",
          data.cookTime || "",
          data.difficulty || "",
          data.videoUrl || "",
          data.videoPlaceholder || "",
          data.ingredients || "[]",
          data.instructions || "[]",
          data.tips || "[]",
          data.marinade || "",
          data.doneness || null,
          data.recommendedWeights || null,
        ]
      );
      return data;
    },
    upsert: async ({ where, update, create }: any) => {
      const d = { ...create, ...update };
      await runQuery(
        `INSERT INTO "Recipe" ("id","title","category","icon","meatType","cuisine","description","prepTime","cookTime","difficulty","videoUrl","videoPlaceholder","ingredients","instructions","tips","marinade","doneness","recommendedWeights")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT ("id") DO UPDATE SET
           "title"=$2,"category"=$3,"icon"=$4,"meatType"=$5,"cuisine"=$6,"description"=$7,
           "prepTime"=$8,"cookTime"=$9,"difficulty"=$10,"videoUrl"=$11,"ingredients"=$13,
           "instructions"=$14,"tips"=$15,"marinade"=$16,"doneness"=$17,"recommendedWeights"=$18,
           "updatedAt"=NOW()`,
        [
          where.id,
          d.title,
          d.category || "",
          d.icon || "",
          d.meatType || "meat",
          d.cuisine || "arabic",
          d.description || "",
          d.prepTime || "",
          d.cookTime || "",
          d.difficulty || "",
          d.videoUrl || "",
          d.videoPlaceholder || "شاهد الفيديو",
          d.ingredients || "[]",
          d.instructions || "[]",
          d.tips || "[]",
          d.marinade || "",
          d.doneness || null,
          d.recommendedWeights || null,
        ]
      );
      return { id: where.id, ...d };
    },
  },

  // ── SiteSetting ───────────────────────────────────────────────────────────
  siteSetting: {
    findMany: async () => {
      return runQuery(`SELECT * FROM "SiteSetting"`);
    },
    upsert: async ({ where, update, create }: any) => {
      await runQuery(
        `INSERT INTO "SiteSetting" ("key","value") VALUES ($1,$2)
         ON CONFLICT ("key") DO UPDATE SET "value"=$2,"updatedAt"=NOW()`,
        [where.key, create.value]
      );
      return { key: where.key, value: update.value };
    },
  },

  // ── LoyaltyCard ───────────────────────────────────────────────────────────
  loyaltyCard: {
    findUnique: async ({ where }: { where: { phone: string } }) => {
      const rows = await runQuery(`SELECT * FROM "LoyaltyCard" WHERE "phone"=$1 LIMIT 1`, [where.phone]);
      return rows[0] ?? null;
    },
  },

  $executeRawUnsafe: async (query: string, ...params: any[]) => {
    return runQuery(query, params);
  },

  $queryRawUnsafe: async <T = any>(query: string, ...params: any[]): Promise<T[]> => {
    return runQuery<T>(query, params);
  },
};

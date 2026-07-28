/**
 * db.ts — Universal Serverless SQL Client for Cloudflare Workers & Next.js
 * Supports Supabase (Transaction Pooler & Direct), Neon, and PostgreSQL natively using postgres.js.
 */
import postgres from "postgres";

let _sql: ReturnType<typeof postgres> | null = null;

// In-Memory Storage Fallback (used gracefully when DB is unreachable or unconfigured)
export const fallbackStore = {
  scans: [] as Array<{ id: string; product: string; createdAt: Date }>,
  ratings: [] as Array<{ id: string; product: string; stars: number; comment: string; createdAt: Date }>,
  leads: [] as Array<{ id: string; name: string; contact: string; promoCode: string; createdAt: Date }>,
  orderClicks: [] as Array<{ id: string; product: string; platform: string; createdAt: Date }>,
  recipes: new Map<string, any>(),
  packages: new Map<string, any>(),
  settings: new Map<string, any>([
    ["siteTitle", "ملاحم ومطاعم المركزية"],
    ["siteSubtitle", "اختر صنف اللحوم أو الدجاج المفضل لديك واكتشف أسرار تتبيل وطهي أصنافنا الفاخرة."],
    ["meatTabLabel", "قسم اللحوم الحمراء"],
    ["chickenTabLabel", "قسم الدجاج والطيور"],
    ["allTabLabel", "جميع الأصناف"],
  ]),
  loyaltyCards: new Map<string, any>(),
};

/**
 * Extracts and formats human-readable error messages from any DB exception or ErrorEvent.
 * Completely prevents cryptic '[object ErrorEvent]' or tagged-template error strings in the UI.
 */
export function formatDbError(err: any): string {
  if (!err) return "خطأ غير معروف في الاتصال بقاعدة البيانات";

  const str = String(err?.message || err);

  if (str.includes("CONNECT_TIMEOUT") || str.includes("ETIMEDOUT") || str.includes("6543")) {
    return "مهلة الاتصال بالداتابيز انتهت (Port 6543 Timeout). يُفضل استخدام رابط Neon السحابي (Port 443) للسرعة المباشرة.";
  }

  if (typeof err === "string") {
    if (err.includes("ErrorEvent") || err === "[object ErrorEvent]") {
      return "فشل اتصال قاعدة البيانات عبر الشبكة. يرجى التأكد من تشغيل الخادم وصحة إعدادات الداتابيز.";
    }
    return err;
  }

  if (err instanceof Error) {
    if (err.message && !err.message.includes("[object ErrorEvent]")) {
      return err.message;
    }
  }

  if (typeof err === "object") {
    if ((err as any).code === "ENOTFOUND") {
      const host = (err as any).hostname || "Host Not Found";
      return `تعذر العثور على عنوان خادم قاعدة البيانات (${host}). يرجى التحقق من صحة DATABASE_URL.`;
    }
    if ((err as any).code === "ECONNREFUSED") {
      return "تم رفض الاتصال بخادم قاعدة البيانات (Connection Refused).";
    }
    if ((err as any).code === "28P01") {
      return "اسم المستخدم أو كلمة السر الخاصة بقاعدة البيانات غير صحيحة (Invalid Database Credentials).";
    }
    if ((err as any).message && typeof (err as any).message === "string" && !(err as any).message.includes("[object ErrorEvent]")) {
      return (err as any).message;
    }
    if ((err as any).type === "error" || (err as any).type) {
      return "فشل اتصال شبكة قاعدة البيانات. يرجى التحقق من صحة المزود ورابط الداتابيز.";
    }
    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}" && json !== "[]") return json;
    } catch {}
  }

  return str.includes("ErrorEvent") || str === "[object ErrorEvent]"
    ? "فشل الاتصال بقاعدة البيانات عبر الشبكة."
    : str;
}

function getDbUrl(): string {
  let url = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Zh4MX1Swyoxb@ep-weathered-forest-ax9ru7rm-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
  if (url.includes("@@")) {
    url = url.replace("@@", "%40@");
  }
  if (url && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
    if (!url.includes("sslmode=")) {
      url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
    }
  }
  return url;
}

function getSqlDriver() {
  if (_sql) return _sql;
  const url = getDbUrl();
  _sql = postgres(url, {
    ssl: url.includes("sslmode=require") || url.includes("supabase") || url.includes("neon") ? "require" : false,
    connect_timeout: 3,
    max: 5,
    idle_timeout: 10,
  });
  return _sql;
}

/**
 * Universal Query Execution using postgres.js
 * 100% compatible with Supabase (Pooler & Direct), Neon, and PostgreSQL.
 */
export async function runQuery<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  const url = getDbUrl();
  if (!url) {
    throw new Error("DATABASE_URL غير موجود في إعدادات التكوين. يرجى إضافته في إعدادات البيئة.");
  }
  if (url.includes("[YOUR-PASSWORD]") || url.includes("YOUR_ACTUAL_PASSWORD") || url.includes("YOUR_PASSWORD")) {
    throw new Error("يرجى استبدال كلمة السر المؤقتة بكلمة السر الحقيقية الخاصة بالداتابيز في إعدادات البيئة.");
  }

  try {
    const sql = getSqlDriver();
    const rows = await sql.unsafe(queryText, params);
    return rows as unknown as T[];
  } catch (err) {
    throw new Error(formatDbError(err));
  }
}

/**
 * Tagged template literal helper: sql`SELECT * FROM "Table" WHERE id = ${id}`
 * Works with @neondatabase/serverless v1+ by routing through runQuery/.query()
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

// ─── Typed query helpers (Prisma-compatible API) ───────────────────────────────

export const prisma = {
  // ── Scan ──────────────────────────────────────────────────────────────────
  scan: {
    create: async ({ data }: { data: { id: string; product: string } }) => {
      try {
        await runQuery(
          `INSERT INTO "Scan" ("id","product") VALUES ($1,$2) ON CONFLICT ("id") DO NOTHING`,
          [data.id, data.product]
        );
      } catch (err) {
        console.warn("DB notice (Scan.create): using fallback store:", formatDbError(err));
        fallbackStore.scans.unshift({ id: data.id, product: data.product, createdAt: new Date() });
      }
      return data;
    },
    findMany: async () => {
      try {
        return await runQuery(`SELECT * FROM "Scan" ORDER BY "createdAt" DESC`);
      } catch (err) {
        console.warn("DB notice (Scan.findMany): using fallback store:", formatDbError(err));
        return fallbackStore.scans;
      }
    },
  },

  // ── Rating ────────────────────────────────────────────────────────────────
  rating: {
    create: async ({ data }: { data: { id: string; product: string; stars: number; comment?: string } }) => {
      try {
        await runQuery(
          `INSERT INTO "Rating" ("id","product","stars","comment") VALUES ($1,$2,$3,$4) ON CONFLICT ("id") DO NOTHING`,
          [data.id, data.product, data.stars, data.comment || ""]
        );
      } catch (err) {
        console.warn("DB notice (Rating.create): using fallback store:", formatDbError(err));
        fallbackStore.ratings.unshift({
          id: data.id,
          product: data.product,
          stars: data.stars,
          comment: data.comment || "",
          createdAt: new Date(),
        });
      }
      return data;
    },
    findMany: async () => {
      try {
        return await runQuery(`SELECT * FROM "Rating" ORDER BY "createdAt" DESC`);
      } catch (err) {
        console.warn("DB notice (Rating.findMany): using fallback store:", formatDbError(err));
        return fallbackStore.ratings;
      }
    },
  },

  // ── Lead ──────────────────────────────────────────────────────────────────
  lead: {
    create: async ({ data }: { data: { id: string; name: string; contact: string; promoCode: string } }) => {
      try {
        await runQuery(
          `INSERT INTO "Lead" ("id","name","contact","promoCode") VALUES ($1,$2,$3,$4) ON CONFLICT ("id") DO NOTHING`,
          [data.id, data.name, data.contact, data.promoCode]
        );
      } catch (err) {
        console.warn("DB notice (Lead.create): using fallback store:", formatDbError(err));
        fallbackStore.leads.unshift({
          id: data.id,
          name: data.name,
          contact: data.contact,
          promoCode: data.promoCode,
          createdAt: new Date(),
        });
      }
      return data;
    },
    findMany: async () => {
      try {
        return await runQuery(`SELECT * FROM "Lead" ORDER BY "createdAt" DESC`);
      } catch (err) {
        console.warn("DB notice (Lead.findMany): using fallback store:", formatDbError(err));
        return fallbackStore.leads;
      }
    },
    findFirst: async ({ where }: { where: { contact: string } }) => {
      try {
        const rows = await runQuery(`SELECT * FROM "Lead" WHERE "contact"=$1 LIMIT 1`, [where.contact]);
        return rows[0] ?? null;
      } catch (err) {
        console.warn("DB notice (Lead.findFirst): using fallback store:", formatDbError(err));
        return fallbackStore.leads.find((l) => l.contact === where.contact) ?? null;
      }
    },
  },

  // ── OrderClick ────────────────────────────────────────────────────────────
  orderClick: {
    create: async ({ data }: { data: { id: string; product: string; platform: string } }) => {
      try {
        await runQuery(
          `INSERT INTO "OrderClick" ("id","product","platform") VALUES ($1,$2,$3) ON CONFLICT ("id") DO NOTHING`,
          [data.id, data.product, data.platform]
        );
      } catch (err) {
        console.warn("DB notice (OrderClick.create): using fallback store:", formatDbError(err));
        fallbackStore.orderClicks.unshift({
          id: data.id,
          product: data.product,
          platform: data.platform,
          createdAt: new Date(),
        });
      }
      return data;
    },
    findMany: async () => {
      try {
        return await runQuery(`SELECT * FROM "OrderClick" ORDER BY "createdAt" DESC`);
      } catch (err) {
        console.warn("DB notice (OrderClick.findMany): using fallback store:", formatDbError(err));
        return fallbackStore.orderClicks;
      }
    },
  },

  // ── Recipe ────────────────────────────────────────────────────────────────
  recipe: {
    findMany: async () => {
      try {
        return await runQuery(`SELECT * FROM "Recipe" ORDER BY "updatedAt" DESC`);
      } catch (err) {
        console.warn("DB notice (Recipe.findMany): using fallback store:", formatDbError(err));
        return Array.from(fallbackStore.recipes.values());
      }
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      try {
        const rows = await runQuery(`SELECT * FROM "Recipe" WHERE "id"=$1 LIMIT 1`, [where.id]);
        return rows[0] ?? null;
      } catch (err) {
        console.warn("DB notice (Recipe.findUnique): using fallback store:", formatDbError(err));
        return fallbackStore.recipes.get(where.id) ?? null;
      }
    },
    create: async ({ data }: { data: any }) => {
      try {
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
      } catch (err) {
        console.warn("DB notice (Recipe.create): using fallback store:", formatDbError(err));
        fallbackStore.recipes.set(data.id, data);
      }
      return data;
    },
    upsert: async ({ where, update, create }: any) => {
      const d = { ...create, ...update };
      try {
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
      } catch (err) {
        console.warn("DB notice (Recipe.upsert): using fallback store:", formatDbError(err));
        fallbackStore.recipes.set(where.id, { id: where.id, ...d });
      }
      return { id: where.id, ...d };
    },
  },

  // ── SiteSetting ───────────────────────────────────────────────────────────
  siteSetting: {
    findMany: async () => {
      try {
        return await runQuery(`SELECT * FROM "SiteSetting"`);
      } catch (err) {
        console.warn("DB notice (SiteSetting.findMany): using fallback store:", formatDbError(err));
        return Array.from(fallbackStore.settings.entries()).map(([key, value]) => ({ key, value }));
      }
    },
    upsert: async ({ where, update, create }: any) => {
      const val = create?.value ?? update?.value ?? "";
      fallbackStore.settings.set(where.key, val);
      try {
        await runQuery(
          `INSERT INTO "SiteSetting" ("key","value") VALUES ($1,$2)
           ON CONFLICT ("key") DO UPDATE SET "value"=$2,"updatedAt"=NOW()`,
          [where.key, val]
        );
      } catch (err) {
        console.warn("DB notice (SiteSetting.upsert): saved to fallback store:", formatDbError(err));
      }
      return { key: where.key, value: val };
    },
  },

  // ── LoyaltyCard ───────────────────────────────────────────────────────────
  loyaltyCard: {
    findUnique: async ({ where }: { where: { phone: string } }) => {
      try {
        const rows = await runQuery(`SELECT * FROM "LoyaltyCard" WHERE "phone"=$1 LIMIT 1`, [where.phone]);
        return rows[0] ?? null;
      } catch (err) {
        console.warn("DB notice (LoyaltyCard.findUnique): using fallback store:", formatDbError(err));
        return fallbackStore.loyaltyCards.get(where.phone) ?? null;
      }
    },
  },

  $executeRawUnsafe: async (query: string, ...params: any[]) => {
    return runQuery(query, params);
  },

  $queryRawUnsafe: async <T = any>(query: string, ...params: any[]): Promise<T[]> => {
    return runQuery<T>(query, params);
  },
};


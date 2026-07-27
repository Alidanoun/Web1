export interface ScanRecord {
  id: string;
  product: string;
  createdAt: string;
}

export interface RatingRecord {
  id: string;
  product: string;
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface LeadRecord {
  id: string;
  name: string;
  contact: string;
  promoCode: string;
  createdAt: string;
}

export interface ClickRecord {
  id: string;
  product: string;
  platform: string;
  createdAt: string;
}

// In-memory persistent tracking buffer for Cloudflare Workers runtime
const globalStore = globalThis as unknown as {
  __scans?: ScanRecord[];
  __ratings?: RatingRecord[];
  __leads?: LeadRecord[];
  __clicks?: ClickRecord[];
};

if (!globalStore.__scans) globalStore.__scans = [];
if (!globalStore.__ratings) globalStore.__ratings = [];
if (!globalStore.__leads) globalStore.__leads = [];
if (!globalStore.__clicks) globalStore.__clicks = [];

export const memoryScans = globalStore.__scans;
export const memoryRatings = globalStore.__ratings;
export const memoryLeads = globalStore.__leads;
export const memoryClicks = globalStore.__clicks;

export function recordMemoryScan(product: string): ScanRecord {
  const scan: ScanRecord = {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    product: product.toLowerCase(),
    createdAt: new Date().toISOString(),
  };
  memoryScans.unshift(scan);
  if (memoryScans.length > 500) memoryScans.pop();
  return scan;
}

export function recordMemoryRating(product: string, stars: number, comment?: string): RatingRecord {
  const rating: RatingRecord = {
    id: `rate_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    product: product.toLowerCase(),
    stars,
    comment: comment || "",
    createdAt: new Date().toISOString(),
  };
  memoryRatings.unshift(rating);
  if (memoryRatings.length > 500) memoryRatings.pop();
  return rating;
}

export function recordMemoryLead(name: string, contact: string, promoCode: string): LeadRecord {
  const lead: LeadRecord = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name || "",
    contact,
    promoCode,
    createdAt: new Date().toISOString(),
  };
  memoryLeads.unshift(lead);
  if (memoryLeads.length > 500) memoryLeads.pop();
  return lead;
}

export function recordMemoryClick(product: string, platform: string): ClickRecord {
  const click: ClickRecord = {
    id: `click_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    product: product.toLowerCase(),
    platform: platform.toLowerCase(),
    createdAt: new Date().toISOString(),
  };
  memoryClicks.unshift(click);
  if (memoryClicks.length > 500) memoryClicks.pop();
  return click;
}

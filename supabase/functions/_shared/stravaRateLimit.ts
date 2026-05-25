// Strava rate-limit-aware fetch helper.
// Strava returns: X-RateLimit-Usage: "short,long" and X-RateLimit-Limit: "short,long".
// Default limits (non-approved apps): short = 100 / 15min, long = 1000 / day.
// We track usage in a shared singleton per Edge Function invocation.

export interface RateBudget {
  short: number;
  long: number;
  shortMax: number;
  longMax: number;
  // when the short window resets (Strava aligns to wall-clock :00/:15/:30/:45)
  shortResetAt: Date;
  // when long window resets (next UTC midnight)
  longResetAt: Date;
}

export const SHORT_SOFT_LIMIT = 90; // leave buffer of 10
export const LONG_SOFT_LIMIT = 950;

function nextQuarterHour(now: Date): Date {
  const d = new Date(now);
  d.setUTCMilliseconds(0);
  d.setUTCSeconds(0);
  const m = d.getUTCMinutes();
  const nextSlot = Math.ceil((m + 1) / 15) * 15;
  d.setUTCMinutes(0);
  d.setTime(d.getTime() + nextSlot * 60_000);
  return d;
}

function nextUtcMidnight(now: Date): Date {
  const d = new Date(now);
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

export function createBudget(initial?: Partial<RateBudget>): RateBudget {
  const now = new Date();
  return {
    short: initial?.short ?? 0,
    long: initial?.long ?? 0,
    shortMax: initial?.shortMax ?? 100,
    longMax: initial?.longMax ?? 1000,
    shortResetAt: initial?.shortResetAt ?? nextQuarterHour(now),
    longResetAt: initial?.longResetAt ?? nextUtcMidnight(now),
  };
}

export class LongLimitReachedError extends Error {
  resumeAfter: Date;
  constructor(resumeAfter: Date) {
    super(`Strava daily limit reached, resume after ${resumeAfter.toISOString()}`);
    this.name = 'LongLimitReachedError';
    this.resumeAfter = resumeAfter;
  }
}

export class ShortLimitReachedError extends Error {
  resumeAfter: Date;
  constructor(resumeAfter: Date) {
    super(`Strava short limit reached, resume after ${resumeAfter.toISOString()}`);
    this.name = 'ShortLimitReachedError';
    this.resumeAfter = resumeAfter;
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parsePair(value: string | null): [number, number] | null {
  if (!value) return null;
  const [a, b] = value.split(',').map((s) => parseInt(s.trim(), 10));
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return [a, b];
}

function refreshWindows(budget: RateBudget) {
  const now = new Date();
  if (now >= budget.shortResetAt) {
    budget.short = 0;
    budget.shortResetAt = nextQuarterHour(now);
  }
  if (now >= budget.longResetAt) {
    budget.long = 0;
    budget.longResetAt = nextUtcMidnight(now);
  }
}

/**
 * Rate-limit aware fetch wrapper for Strava API.
 * - Checks budget before each call. If short budget is exhausted, throws
 *   ShortLimitReachedError so caller can persist state and reschedule.
 * - Updates budget from response headers.
 * - Treats 429 as an authoritative "stop" signal.
 */
export async function stravaFetch(
  url: string,
  accessToken: string,
  budget: RateBudget,
  opts: { maxWaitMs?: number } = {}
): Promise<Response> {
  refreshWindows(budget);

  if (budget.long >= LONG_SOFT_LIMIT) {
    throw new LongLimitReachedError(budget.longResetAt);
  }
  if (budget.short >= SHORT_SOFT_LIMIT) {
    throw new ShortLimitReachedError(budget.shortResetAt);
  }

  // Small spacing to be polite (≈ 8 req/s max).
  await delay(120);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

  const usage = parsePair(res.headers.get('x-ratelimit-usage'));
  const limits = parsePair(res.headers.get('x-ratelimit-limit'));
  if (limits) {
    budget.shortMax = limits[0];
    budget.longMax = limits[1];
  }
  if (usage) {
    budget.short = usage[0];
    budget.long = usage[1];
  } else {
    // No header (rare) — assume one request consumed.
    budget.short += 1;
    budget.long += 1;
  }

  if (res.status === 429) {
    // Hard stop. Use short window reset.
    throw new ShortLimitReachedError(budget.shortResetAt);
  }

  return res;
}
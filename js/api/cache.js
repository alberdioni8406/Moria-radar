// js/api/cache.js
// Minimal localStorage-backed cache with TTL. Never used to fabricate data —
// only to avoid re-hitting public APIs for unchanged values within the TTL.

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(`moria-radar:${key}`);
    if (!raw) return null;
    const { value, expiresAt, fetchedAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) return { stale: true, value, fetchedAt };
    return { stale: false, value, fetchedAt };
  } catch {
    return null;
  }
}

export function cacheSet(key, value, ttlMs) {
  try {
    localStorage.setItem(
      `moria-radar:${key}`,
      JSON.stringify({ value, fetchedAt: Date.now(), expiresAt: Date.now() + ttlMs })
    );
  } catch {
    // localStorage unavailable/full — degrade silently, no caching
  }
}

// Wraps a fetch call with cache + graceful failure. Returns:
// { ok: true, data, stale: false }
// { ok: true, data, stale: true, fetchedAt }   <- served from stale cache after a failed refetch
// { ok: false, error }                          <- no data available at all, caller must show "unavailable"
export async function cachedFetch(key, ttlMs, fetcher) {
  const cached = cacheGet(key);
  if (cached && !cached.stale) return { ok: true, data: cached.value, stale: false };

  try {
    const data = await fetcher();
    cacheSet(key, data, ttlMs);
    return { ok: true, data, stale: false };
  } catch (err) {
    if (cached && cached.stale) {
      return { ok: true, data: cached.value, stale: true, fetchedAt: cached.fetchedAt };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

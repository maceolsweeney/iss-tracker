// Fetch + cache the ISS Two-Line Element set from Celestrak's GP API.
// TLEs drift slowly, so we cache the result and refetch at most ~twice a day
// rather than hammering Celestrak on every page load.

export const ISS_NORAD_ID = 25544
export const TLE_URL = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${ISS_NORAD_ID}&FORMAT=TLE`

const CACHE_KEY = 'iss-tracker:tle'
const MAX_AGE_MS = 12 * 60 * 60 * 1000 // 12 hours

/**
 * Parse Celestrak's TLE text into structured lines. Handles both the 3-line
 * form (name + two element lines) and the bare 2-line form.
 * @param {string} text
 * @returns {{ name: string, line1: string, line2: string }}
 */
export function parseTLE(text) {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trimEnd())
    .filter(Boolean)

  let name, line1, line2
  if (lines.length >= 3) {
    ;[name, line1, line2] = lines
  } else if (lines.length === 2) {
    ;[line1, line2] = lines
  }

  if (!line1?.startsWith('1 ') || !line2?.startsWith('2 ')) {
    throw new Error('Unexpected TLE format from Celestrak')
  }
  return { name: name?.trim() || 'ISS (ZARYA)', line1, line2 }
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.tle?.line1 || !parsed?.fetchedAt) return null
    return parsed
  } catch {
    return null // unparseable / localStorage unavailable
  }
}

function writeCache(tle) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ tle, fetchedAt: Date.now() }))
  } catch {
    // localStorage may be unavailable (private mode / quota) — caching is best-effort.
  }
}

/**
 * Get the current ISS TLE. Returns the cached copy while it's fresh (< 12h),
 * otherwise fetches from Celestrak. If the network fails, falls back to a stale
 * cached copy when one exists.
 *
 * @param {{ force?: boolean }} [opts] force a refetch regardless of cache age
 * @returns {Promise<{ name, line1, line2, fetchedAt: number, fromCache: boolean, stale?: boolean }>}
 */
export async function getTLE({ force = false } = {}) {
  const cached = readCache()
  const isFresh = cached && Date.now() - cached.fetchedAt < MAX_AGE_MS
  if (cached && isFresh && !force) {
    return { ...cached.tle, fetchedAt: cached.fetchedAt, fromCache: true }
  }

  try {
    const res = await fetch(TLE_URL)
    if (!res.ok) throw new Error(`Celestrak responded ${res.status}`)
    const tle = parseTLE(await res.text())
    writeCache(tle)
    return { ...tle, fetchedAt: Date.now(), fromCache: false }
  } catch (err) {
    if (cached) {
      // Better a stale TLE than nothing — accuracy degrades gracefully.
      return { ...cached.tle, fetchedAt: cached.fetchedAt, fromCache: true, stale: true }
    }
    throw err
  }
}

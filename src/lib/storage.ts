/**
 * Thin localStorage wrapper. Every call is guarded so a storage failure
 * (quota exceeded, privacy mode, corrupted JSON) never crashes the app -
 * it just falls back to the caller-supplied default and logs a warning.
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] failed to load "${key}"`, error);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] failed to save "${key}"`, error);
  }
}

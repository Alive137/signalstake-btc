// SignalStake BTC — Blockchain Read Cache

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class Cache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, value: T, ttlMs: number = 12_000): void {
    this.store.set(key, { value, timestamp: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.timestamp) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = new Cache();

export const TTL = {
  VAULT_STATS: 12_000,
  USER_INFO:   10_000,
  SIGNAL:      30_000,
} as const;

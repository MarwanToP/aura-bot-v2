// Storage abstraction layer for LocalStorage persistence with remote API migration path
export class StorageAdapter {
  private static PREFIX = 'aura_dashboard_';

  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`[StorageAdapter] Failed to read ${key}`, e);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`[StorageAdapter] Failed to write ${key}`, e);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (e) {
      console.error(`[StorageAdapter] Failed to remove ${key}`, e);
    }
  }

  static clearAll(): void {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(this.PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error('[StorageAdapter] Failed to clear storage', e);
    }
  }
}

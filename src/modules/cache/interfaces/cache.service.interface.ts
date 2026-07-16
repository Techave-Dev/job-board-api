export const ICacheService = Symbol('ICacheService');

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  scanAndDelete(pattern: string): Promise<void>;
  isConnected(): boolean;
}

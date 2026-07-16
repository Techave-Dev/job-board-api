export function nullableParam<T>(value: T | undefined | null): T {
  return (value ?? null) as T;
}

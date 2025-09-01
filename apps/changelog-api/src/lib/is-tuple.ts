export function isTuple<T>(array: T[]): array is [T, ...T[]] {
  return array.length > 0;
}

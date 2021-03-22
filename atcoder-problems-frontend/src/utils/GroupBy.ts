export function groupBy<T, K>(
  array: T[],
  selector: (item: T) => K
): Map<K, T[]> {
  const result = new Map<K, T[]>();
  array.forEach((item) => {
    const key = selector(item);
    const list = result.get(key) ?? [];
    list.push(item);
    result.set(key, list);
  });
  return result;
}
export function countBy<T, K>(
  array: T[],
  selector: (item: T) => K
): Map<K, number> {
  const grouped = groupBy(array, selector);
  const count: [K, number][] = Array.from(
    grouped.entries()
  ).map(([key, group]) => [key, group.length]);
  return new Map(count);
}

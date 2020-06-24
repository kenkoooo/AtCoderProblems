export function groupBy<T, K>(
  array: T[],
  selector: (item: T) => K
): Map<K, T[]> {
  const result = new Map<K, T[]>();
  array.forEach((item) => {
    const key = selector(item);
    const list = result.get(key);
    if (list) {
      list.push(item);
      result.set(key, list);
    } else {
      result.set(key, [item]);
    }
  });
  return result;
}

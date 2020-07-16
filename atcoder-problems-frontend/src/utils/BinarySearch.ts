export function binarySearch<T, V>(
  array: T[],
  value: V,
  compare: (a: T, value: V) => number
) {
  if (compare(array[0], value) === 0) {
    return 0;
  }
  let ng = 0;
  let ok = array.length;
  while (ok - ng > 1) {
    const m = Math.floor((ok + ng) / 2);
    if (compare(array[m], value) < 0) {
      ng = m;
    } else {
      ok = m;
    }
  }
  return ok;
}

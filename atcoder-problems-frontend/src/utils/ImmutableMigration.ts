/*
 * Since Immutable.js is no longer updated,
 * let's migrate from them to the standard libraries.
 * */

import { List, Map as ImmutableMap } from "immutable";

export function convertMap<K, V>(immutableMap: ImmutableMap<K, V>): Map<K, V> {
  return immutableMap.entrySeq().reduce((map, [key, value]) => {
    map.set(key, value);
    return map;
  }, new Map<K, V>());
}

export function convertMapOfLists<K, V>(
  immutableMapOfLists: ImmutableMap<K, List<V>>
): Map<K, V[]> {
  return convertMap(immutableMapOfLists.map((list) => list.toArray()));
}

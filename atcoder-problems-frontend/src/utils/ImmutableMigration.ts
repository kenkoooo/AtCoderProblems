/*
 * Since Immutable.js is no longer updated,
 * let's migrate from them to the standard libraries.
 * */

import { Map as ImmutableMap } from "immutable";

export function convertMap<K, V>(immutableMap: ImmutableMap<K, V>): Map<K, V> {
  return immutableMap.entrySeq().reduce((map, [key, value]) => {
    map.set(key, value);
    return map;
  }, new Map<K, V>());
}

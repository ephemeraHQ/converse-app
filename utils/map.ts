export const lastItemInMap = <K, V>(map: Map<K, V>): [K, V] | undefined => Array.from(map).pop()
export const lastKeyInMap = <K>(map: Map<K, any>): K | undefined => Array.from(map.keys()).pop()
export const lastValueInMap = <V>(map: Map<any, V>): V | undefined => Array.from(map.values()).pop()

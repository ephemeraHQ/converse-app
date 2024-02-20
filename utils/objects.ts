export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]) =>
  Object.fromEntries(
    keys.filter((key) => key in obj).map((key) => [key, obj[key]])
  ) as Pick<T, K>;

export const inclusivePick = <
  T extends object,
  K extends string | number | symbol,
>(
  obj: T,
  keys: K[]
) =>
  Object.fromEntries(
    keys.map((key) => [key, obj[key as unknown as keyof T]])
  ) as { [key in K]: key extends keyof T ? T[key] : undefined };

export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]) =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K))
  ) as Omit<T, K>;

export class LimitedMap<K, V> extends Map<K, V> {
  limit: number;

  constructor(limit: number) {
    super();
    this.limit = limit;
  }

  set(key: K, value: V) {
    if (this.size >= this.limit) {
      const oldestKey = this.keys().next().value;
      this.delete(oldestKey);
    }
    super.set(key, value);
    return this;
  }
}

export const isEmptyObject = <T extends object>(obj: T): boolean =>
  Object.keys(obj).length === 0;

export const haveSameItems = (array1: any[], array2: any[]) => {
  if (array1.length !== array2.length) return;
  return array1.every((element) => array1.includes(element));
};

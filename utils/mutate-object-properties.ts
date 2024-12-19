type Object = Record<string, unknown>;

function isPlainObject(value: unknown): value is Object {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function mutateObjectProperties<T>(
  object: T,
  properties: Partial<T>,
  options?: {
    level: number;
  }
): T {
  const level = options?.level ?? 0; // By default only update level 0 because otherwise we have maximum recursion problem becaue of client from the SDK etc...
  for (const [key, newValue] of Object.entries(properties) as [
    keyof T,
    T[keyof T],
  ][]) {
    if (isPlainObject(newValue) && level > 0) {
      const existingValue = object[key];
      if (isPlainObject(existingValue)) {
        mutateObjectProperties(
          existingValue as Object,
          newValue as Partial<Object>,
          { level: level - 1 }
        );
      } else {
        object[key] = newValue as T[keyof T];
      }
    } else {
      object[key] = newValue;
    }
  }

  return object;
}

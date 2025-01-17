export function getRandomId() {
  return Math.random().toString(36).substring(2, 15);
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunk<T>(array: T[], size: number): T[][] {
  return array.reduce((acc, _, i) => {
    return i % size === 0 ? [...acc, array.slice(i, i + size)] : acc;
  }, [] as T[][]);
}

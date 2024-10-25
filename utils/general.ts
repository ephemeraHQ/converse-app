export function getRandomId() {
  return Math.random().toString(36).substring(2, 15);
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

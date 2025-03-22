// Helper to have a consistent way to format query keys
export function getReactQueryKey(args: { baseStr: string; [key: string]: string | undefined }) {
  const { baseStr, ...rest } = args
  return [baseStr, ...Object.entries(rest).map(([key, value]) => `${key}: ${value}`)]
}

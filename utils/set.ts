// Helper function to compare two sets
export const areSetsEqual = (setA: Set<unknown>, setB: Set<unknown>): boolean => {
  if (setA.size !== setB.size) return false
  for (const a of setA) if (!setB.has(a)) return false
  return true
}

import deepmerge from "deepmerge"

export const arraysContainSameElements = <T>(arr1: T[], arr2: T[]) => {
  if (arr1.length !== arr2.length) return false
  const sortedArr1 = arr1.slice().sort()
  const sortedArr2 = arr2.slice().sort()
  for (let i = 0; i < sortedArr1.length; i++) {
    if (sortedArr1[i] !== sortedArr2[i]) return false
  }
  return true
}

export function convertToArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) {
    return value
  }
  return [value]
}

/**
/**
 * Merges two arrays of objects, combining matching objects using deep merge
 * 
 * @param arr1 First array of objects
 * @param arr2 Second array of objects
 * @param compareObjects Function to determine if two objects are the same
 * @returns Merged array with unique objects, where matching objects are deep merged
 * 
 * @example
 * const arr1 = [{id: 1, data: {a: 1}}, {id: 2, data: {a: 2}}]
 * const arr2 = [{id: 1, data: {b: 3}}, {id: 3, data: {b: 4}}]
 * mergeArraysObjects(
 *   arr1, 
 *   arr2,
 *   (o1, o2) => o1.id === o2.id
 * )
 * // Returns: [
 * //   {id: 1, data: {a: 1, b: 3}}, 
 * //   {id: 2, data: {a: 2}}, 
 * //   {id: 3, data: {b: 4}}
 * // ]
 */
export function mergeArraysObjects<T extends Record<string, unknown>>(args: {
  arr1: T[]
  arr2: T[]
  compareObjects: (obj1: T, obj2: T) => boolean
}): T[] {
  const { arr1, arr2, compareObjects } = args

  const result = [...arr1]

  arr2.forEach((obj2) => {
    const matchIndex = result.findIndex((obj1) => compareObjects(obj1, obj2))

    if (matchIndex >= 0) {
      // Deep merge matching objects
      result[matchIndex] = deepmerge(result[matchIndex], obj2) as T
    } else {
      result.push(obj2)
    }
  })

  return result
}

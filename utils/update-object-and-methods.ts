export function updateObjectAndMethods<T>(object: T, properties: Partial<T>): T {
  // Create new object while preserving prototype chain and methods
  const updatedObject = Object.create(
    Object.getPrototypeOf(object),
    Object.getOwnPropertyDescriptors(object),
  )
  // Apply updates to the new object
  return Object.assign(updatedObject, properties)
}

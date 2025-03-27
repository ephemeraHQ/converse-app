export function withTimeout<T>(args: {
  promise: Promise<T>
  timeoutMs: number
  errorMessage?: string
}): Promise<T> {
  const { promise, timeoutMs, errorMessage = "Operation timed out" } = args

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

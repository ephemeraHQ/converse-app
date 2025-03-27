/**
 * Repeatedly calls a function until it returns true, then resolves the promise.
 * Checks every 100ms by default.
 */
export function waitUntilPromise(args: {
  checkFn: () => boolean
  intervalMs?: number
  timeoutMs?: number
}): Promise<void> {
  const { checkFn, intervalMs = 100, timeoutMs } = args

  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    let timeoutId: NodeJS.Timeout | undefined

    const check = () => {
      if (checkFn()) {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        resolve()
      } else {
        if (timeoutMs && Date.now() - startTime > timeoutMs) {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          reject(new Error("Wait until promise timed out"))
        } else {
          timeoutId = setTimeout(check, intervalMs)
        }
      }
    }

    check()
  })
}

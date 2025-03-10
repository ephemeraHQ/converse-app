/**
 * Repeatedly calls a function until it returns true, then resolves the promise.
 * Checks every 100ms by default.
 */
export function waitUntilPromise(args: {
  checkFn: () => boolean
  intervalMs?: number
}): Promise<void> {
  const { checkFn, intervalMs = 100 } = args

  return new Promise((resolve) => {
    const check = () => {
      if (checkFn()) {
        resolve()
      } else {
        setTimeout(check, intervalMs)
      }
    }
    check()
  })
}

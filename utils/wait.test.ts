// sync.test.js

import { wait } from "./wait"

describe("wait function", () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it("should resolve after the specified time", async () => {
    const waitPromise = wait(1000)

    // Fast-forward time by 1000ms
    jest.advanceTimersByTime(1000)

    await expect(waitPromise).resolves.toBeUndefined()
  })

  it("should not resolve before the specified time", async () => {
    const waitPromise = wait(1000)

    // Fast-forward time by 500ms
    jest.advanceTimersByTime(500)

    // The promise should still be pending
    let isResolved = false
    waitPromise.then(() => {
      isResolved = true
    })

    // Allow any pending promises to resolve
    await Promise.resolve()

    expect(isResolved).toBe(false)

    // Fast-forward the remaining time
    jest.advanceTimersByTime(500)

    await expect(waitPromise).resolves.toBeUndefined()
    expect(isResolved).toBe(true)
  })

  it("should handle zero delay correctly", async () => {
    const waitPromise = wait(0)

    jest.advanceTimersByTime(0)

    await expect(waitPromise).resolves.toBeUndefined()
  })
})

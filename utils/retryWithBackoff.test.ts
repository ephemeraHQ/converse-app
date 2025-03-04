// retryWithBackoff.test.ts
import logger from "./logger"
import { retryWithBackoff } from "./retryWithBackoff"
import { wait } from "./wait"

jest.mock("./wait", () => ({
  wait: jest.fn(() => Promise.resolve()),
}))

jest.mock("./logger", () => ({
  warn: jest.fn(),
}))

describe("retryWithBackoff", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return result when fn succeeds on first try", async () => {
    const fn = jest.fn().mockResolvedValue("success")

    const result = await retryWithBackoff({ fn })

    expect(result).toBe("success")
    expect(fn).toHaveBeenCalledTimes(1)
    expect(wait).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it("should retry when fn fails once and then succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockResolvedValue("success")

    const result = await retryWithBackoff({ fn })

    expect(result).toBe("success")
    expect(fn).toHaveBeenCalledTimes(2)
    expect(wait).toHaveBeenCalledTimes(1)
    expect(wait).toHaveBeenCalledWith(1000) // default delay
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith("Retry attempt 1 failed. Retrying in 1000ms...")
  })

  it("should throw error after max retries when fn always fails", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("Always fails"))
    const retries = 3

    await expect(retryWithBackoff({ fn, retries })).rejects.toThrow("Always fails")

    expect(fn).toHaveBeenCalledTimes(retries)
    expect(wait).toHaveBeenCalledTimes(retries - 1)
    expect(logger.warn).toHaveBeenCalledTimes(retries - 1)
  })

  it("should increase delay according to factor and maxDelay", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("Always fails"))
    const retries = 5
    const delay = 1000
    const factor = 2
    const maxDelay = 8000

    await expect(retryWithBackoff({ fn, retries, delay, factor, maxDelay })).rejects.toThrow()

    expect(wait).toHaveBeenCalledTimes(retries - 1)
    expect(wait).toHaveBeenNthCalledWith(1, 1000)
    expect(wait).toHaveBeenNthCalledWith(2, 2000)
    expect(wait).toHaveBeenNthCalledWith(3, 4000)
    expect(wait).toHaveBeenNthCalledWith(4, 8000)
  })

  it("should call onError when fn fails", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockResolvedValue("success")
    const onError = jest.fn().mockResolvedValue(undefined)

    const result = await retryWithBackoff({ fn, onError })

    expect(result).toBe("success")
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(new Error("First attempt failed"))
  })

  it("should log correct warning messages", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockRejectedValueOnce(new Error("Second attempt failed"))
      .mockResolvedValue("success")

    await retryWithBackoff({ fn })

    expect(logger.warn).toHaveBeenCalledTimes(2)
    expect(logger.warn).toHaveBeenNthCalledWith(1, "Retry attempt 1 failed. Retrying in 1000ms...")
    expect(logger.warn).toHaveBeenNthCalledWith(2, "Retry attempt 2 failed. Retrying in 2000ms...")
  })

  it("should not exceed maxDelay", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("Always fails"))
    const retries = 5
    const delay = 1000
    const factor = 3
    const maxDelay = 5000

    await expect(retryWithBackoff({ fn, retries, delay, factor, maxDelay })).rejects.toThrow()

    expect(wait).toHaveBeenCalledTimes(retries - 1)
    expect(wait).toHaveBeenNthCalledWith(1, 1000)
    expect(wait).toHaveBeenNthCalledWith(2, 3000)
    expect(wait).toHaveBeenNthCalledWith(3, 5000) // Exceeds maxDelay, should use maxDelay
    expect(wait).toHaveBeenNthCalledWith(4, 5000)
  })

  it("should throw if onError throws an error", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("fn failed"))
    const onError = jest.fn().mockRejectedValue(new Error("onError failed"))

    await expect(retryWithBackoff({ fn, onError })).rejects.toThrow("onError failed")

    expect(fn).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(new Error("fn failed"))
  })
})

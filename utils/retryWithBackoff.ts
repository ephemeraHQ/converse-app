import logger from "./logger"
import { wait } from "./wait"

export const retryWithBackoff = async <T>({
  fn, // The function to retry
  retries = 5, // Maximum number of retries
  delay = 1000, // Initial delay in milliseconds
  factor = 2, // Exponential factor
  maxDelay = 30000, // Maximum delay in milliseconds
  context, // Context to log in error message
  onError, // Function to call on error
}: {
  fn: () => Promise<T>
  retries?: number
  delay?: number
  factor?: number
  maxDelay?: number
  context?: string
  onError?: (error: unknown) => Promise<void>
}): Promise<T> => {
  let attempt = 0
  let currentDelay = delay

  while (attempt < retries) {
    try {
      return await fn()
    } catch (error) {
      attempt++
      if (attempt >= retries) {
        throw error // Exceeded max retries, propagate the error
      }
      logger.warn(
        `Retry attempt ${attempt} failed. Retrying in ${currentDelay}ms...${context ?? ""}`,
      )
      if (onError) {
        await onError(error)
      }
      await wait(currentDelay)
      currentDelay = Math.min(currentDelay * factor, maxDelay)
    }
  }
  throw new Error(
    context ? `Failed to execute: ${context}` : "Failed to execute function after max retries",
  )
}

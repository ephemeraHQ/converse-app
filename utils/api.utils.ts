/**
 * Creates a stateful container to de-duplicate fetches
 */
export function createDedupedFetcher() {
  const activeRequests = new Map<string, Promise<any>>();

  return {
    // NOTE: this is returned as an object so that hover docs are attached to the result

    /**
     * Ensures that calls made to `fetch` while another is already loading,
     * will wait for and return the result of the in progress call
     */
    async fetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
      const existingRequest = activeRequests.get(key);
      if (existingRequest) return existingRequest;

      // Create a new request promise
      const req = fetchFn().finally(() => {
        // Remove the request from the cache when it completes (success or error)
        activeRequests.delete(key);
      });

      // Store the promise in the cache
      activeRequests.set(key, req);

      return req;
    },
  };
}

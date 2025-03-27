import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { memo } from "react"
import { config } from "@/config"
import { persistLogger } from "@/utils/logger"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { DEFAULT_GC_TIME } from "@/utils/react-query/react-query.constants"
import { reactQueryPersister } from "./react-query-persister"

export const ReactQueryPersistProvider = memo(function ReactQueryPersistProvider(props: {
  children: React.ReactNode
}) {
  const { children } = props

  return (
    <PersistQueryClientProvider
      client={reactQueryClient}
      persistOptions={{
        persister: reactQueryPersister,
        maxAge: DEFAULT_GC_TIME,
        buster: config.reactQueryPersistCacheIsEnabled ? "v4" : undefined,
        dehydrateOptions: {
          // Determines which queries should be persisted to storage
          shouldDehydrateQuery(query) {
            if (!config.reactQueryPersistCacheIsEnabled) {
              persistLogger.debug("Not dehydrating query because persist cache is disabled")
              return false
            }

            const shouldHydrate =
              query.meta?.persist !== false &&
              query.state.status !== "pending" &&
              query.state.fetchStatus !== "fetching"

            return shouldHydrate
          },
        },
      }}
      onSuccess={() => {
        persistLogger.debug("React Query client hydrated")
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
})

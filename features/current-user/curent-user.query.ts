import { queryOptions } from "@tanstack/react-query"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getReactQueryKey } from "@/utils/react-query/react-query.utils"
import { fetchCurrentUser, ICurrentUser } from "./current-user-api"

export function getCurrentUserQueryOptions(args?: { caller?: string }) {
  const { caller } = args ?? {}

  return queryOptions({
    meta: {
      caller,
    },
    queryKey: getReactQueryKey({
      baseStr: "current-user",
    }),
    queryFn: fetchCurrentUser,
  })
}

export function setCurrentUserQueryData(args: { user: ICurrentUser }) {
  const { user } = args
  return reactQueryClient.setQueryData(getCurrentUserQueryOptions().queryKey, user)
}

export function invalidateCurrentUserQuery() {
  return reactQueryClient.invalidateQueries({
    queryKey: getCurrentUserQueryOptions().queryKey,
  })
}

export function getCurrentUserQueryData() {
  return reactQueryClient.getQueryData(getCurrentUserQueryOptions().queryKey)
}

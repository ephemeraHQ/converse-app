import { queryOptions } from "@tanstack/react-query"
import { reactQueryClient } from "@/utils/react-query/react-query-client"
import { fetchCurrentUser, ICurrentUser } from "./current-user-api"

const currentUserQueryKey = () => ["current-user"] as const

export function getCurrentUserQueryOptions() {
  return queryOptions({
    queryKey: currentUserQueryKey(),
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

export function ensureCurrentUserQueryData() {
  return reactQueryClient.ensureQueryData(getCurrentUserQueryOptions())
}

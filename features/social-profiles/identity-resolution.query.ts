import { useQuery } from "@tanstack/react-query"
import { identityResolutionApi } from "@/features/social-profiles/identity-resolution.api"
import {
  isValidBaseName,
  isValidEnsName,
  isValidUnstoppableDomainName,
} from "@/features/social-profiles/name-validation.utils"

export function useEnsNameResolution(name: string | undefined) {
  const isValid = isValidEnsName(name)

  return useQuery({
    queryKey: ["identity", "ens", name],
    queryFn: () => identityResolutionApi.resolveEnsName({ name: name! }),
    enabled: Boolean(name) && isValid,
  })
}

export function useBaseNameResolution(name: string | undefined) {
  const isValid = isValidBaseName(name)

  return useQuery({
    queryKey: ["identity", "base", name],
    queryFn: () => identityResolutionApi.resolveBaseName({ name: name! }),
    enabled: Boolean(name) && isValid,
  })
}

export function useUnstoppableDomainNameResolution(name: string | undefined) {
  const isValid = isValidUnstoppableDomainName(name)

  return useQuery({
    queryKey: ["identity", "unstoppable-domains", name],
    queryFn: () => identityResolutionApi.resolveUnstoppableDomainName({ name: name! }),
    enabled: Boolean(name) && isValid,
  })
}

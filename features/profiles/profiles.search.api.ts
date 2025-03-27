import { z } from "zod"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"
import { IEthereumAddress } from "@/utils/evm/address"

// Schema for individual profile
const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
  description: z.string().nullable(),
  xmtpId: z.custom<IXmtpInboxId>(),
  privyAddress: z.custom<IEthereumAddress>(),
})

// Schema for the API response
const SearchProfilesResponseSchema = z.array(ProfileSchema)

type ISearchProfilesResponse = z.infer<typeof SearchProfilesResponseSchema>

export type ISearchProfilesResult = z.infer<typeof ProfileSchema>

export const searchProfiles = async ({ searchQuery }: { searchQuery: string }) => {
  const { data } = await convosApi.get<ISearchProfilesResponse>("/api/v1/profiles/search", {
    params: { query: searchQuery },
  })

  const result = SearchProfilesResponseSchema.safeParse(data)

  if (!result.success) {
    captureError(result.error)
  }

  return data
}

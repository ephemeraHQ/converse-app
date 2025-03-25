import { z } from "zod"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"

export type ICurrentUserId = string & { readonly __brand: unique symbol }

export const CurrentUserSchema = z.object({
  id: z.custom<ICurrentUserId>(),
  identities: z.array(
    z.object({
      id: z.string(),
      privyAddress: z.string(),
      xmtpId: z.string().nullable(),
    }),
  ),
})

export type ICurrentUser = z.infer<typeof CurrentUserSchema>

export async function fetchCurrentUser(): Promise<ICurrentUser> {
  const { data } = await convosApi.get<ICurrentUser>("/api/v1/users/me")

  const parseResult = CurrentUserSchema.safeParse(data)
  if (!parseResult.success) {
    captureError(
      new Error(`Failed to parse current user response: ${JSON.stringify(parseResult.error)}`),
    )
  }

  return data
}

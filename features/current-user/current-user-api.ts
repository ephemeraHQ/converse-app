import { z } from "zod"
import { api } from "@/utils/api/api"
import { captureError } from "@/utils/capture-error"

export const CurrentUserSchema = z.object({
  id: z.string(),
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
  const { data } = await api.get<ICurrentUser>("/api/v1/users/me")

  const parseResult = CurrentUserSchema.safeParse(data)
  if (!parseResult.success) {
    captureError(
      new Error(`Failed to parse current user response: ${JSON.stringify(parseResult.error)}`),
    )
  }

  return data
}

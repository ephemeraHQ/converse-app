import { currentUserSchema, IConvosCurrentUser } from "@/features/current-user/current-user.types"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"

export async function fetchCurrentUser(): Promise<IConvosCurrentUser> {
  const { data } = await convosApi.get<IConvosCurrentUser>("/api/v1/users/me")

  const parseResult = currentUserSchema.safeParse(data)
  if (!parseResult.success) {
    captureError(
      new Error(`Failed to parse current user response: ${JSON.stringify(parseResult.error)}`),
    )
  }

  return data
}

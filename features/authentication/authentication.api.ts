import { z } from "zod"
import { convosApi } from "@/utils/convos-api/convos-api-instance"
import { ApiError } from "@/utils/error"
import { AUTHENTICATE_ROUTE } from "./authentication.constants"

const fetchJwtResponseSchema = z.object({
  token: z.string(),
})

type FetchJwtResponse = z.infer<typeof fetchJwtResponseSchema>

export async function fetchJwt({ signal }: { signal?: AbortSignal }): Promise<FetchJwtResponse> {
  try {
    const response = await convosApi.post<FetchJwtResponse>(AUTHENTICATE_ROUTE, {
      signal,
    })
    return fetchJwtResponseSchema.parse(response.data)
  } catch (error) {
    throw new ApiError({
      error,
      additionalMessage: "Failed to fetch JWT",
    })
  }
}

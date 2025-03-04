import { z } from "zod"
import { api } from "@/utils/api/api"
import { handleApiError } from "@/utils/api/api.error"
import { AUTHENTICATE_ROUTE } from "./authentication.constants"

const fetchJwtResponseSchema = z.object({
  token: z.string(),
})

type FetchJwtResponse = z.infer<typeof fetchJwtResponseSchema>

export async function fetchJwt({ signal }: { signal?: AbortSignal }): Promise<FetchJwtResponse> {
  try {
    const response = await api.post<FetchJwtResponse>(AUTHENTICATE_ROUTE, {
      signal,
    })
    return fetchJwtResponseSchema.parse(response.data)
  } catch (error) {
    throw handleApiError(error, "fetchJwt")
  }
}

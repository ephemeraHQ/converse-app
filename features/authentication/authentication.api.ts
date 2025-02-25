import { z } from "zod";
import { api } from "@/utils/api/api";
import { handleApiError } from "@/utils/api/api.error";
import { AUTHENTICATION_ROUTES } from "./authentication.constants";

const fetchJwtResponseSchema = z.object({
  token: z.string(),
});

type FetchJwtResponse = z.infer<typeof fetchJwtResponseSchema>;

export async function fetchJwt(): Promise<FetchJwtResponse> {
  try {
    const response = await api.post<FetchJwtResponse>(
      AUTHENTICATION_ROUTES.AUTHENTICATE,
    );
    return fetchJwtResponseSchema.parse(response.data);
  } catch (error) {
    throw handleApiError(error, "fetchJwt");
  }
}

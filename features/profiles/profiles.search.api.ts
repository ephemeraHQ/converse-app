import { api } from "@/utils/api/api";
import { captureError } from "@/utils/capture-error";
import { z } from "zod";

// Schema for individual profile
const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
  description: z.string().nullable(),
  xmtpId: z.string(),
  privyAddress: z.string(),
});

// Schema for the API response
const SearchProfilesResponseSchema = z.array(ProfileSchema);

type ISearchProfilesResponse = z.infer<typeof SearchProfilesResponseSchema>;

export type ISearchProfilesResult = z.infer<typeof ProfileSchema>;

export const searchProfiles = async ({
  searchQuery,
}: {
  searchQuery: string;
}) => {
  const { data } = await api.get<ISearchProfilesResponse>(
    "/api/v1/profiles/search",
    {
      params: { query: searchQuery },
    }
  );

  const result = SearchProfilesResponseSchema.safeParse(data);

  if (!result.success) {
    captureError(result.error);
  }

  return data;
};

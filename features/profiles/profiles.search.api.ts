import { api } from "@/utils/api/api";
import { captureError } from "@/utils/capture-error";
import { z } from "zod";

const SearchProfilesResultSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
    description: z.string().nullable(),
    xmtpId: z.string(),
  })
);

export type ISearchProfilesResult = z.infer<
  typeof SearchProfilesResultSchema
>[0];

export const searchProfiles = async ({
  searchQuery,
}: {
  searchQuery: string;
}): Promise<ISearchProfilesResult[]> => {
  const { data } = await api.get("/api/v1/profiles/search", {
    params: { query: searchQuery },
  });

  const result = SearchProfilesResultSchema.safeParse(data);

  if (!result.success) {
    captureError(result.error);
  }

  return data;
};

import { api } from "@/utils/api/api";
import { z } from "zod";
import {
  ConvosProfileForInboxSchema,
  type IConvosProfileForInbox,
} from "@/features/profiles/profiles.api";

const SearchProfilesResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  xmtpId: z.string(),
});

export type ISearchProfilesResult = z.infer<typeof SearchProfilesResultSchema>;

export const searchProfiles = async ({
  searchQuery,
}: {
  searchQuery: string;
}): Promise<ISearchProfilesResult[]> => {
  const { data } = await api.get("/api/v1/profiles/search", {
    params: { query: searchQuery },
  });
  return z.array(SearchProfilesResultSchema).parse(data);
};

export const fetchProfile = async (
  xmtpId: string
): Promise<IConvosProfileForInbox> => {
  const { data } = await api.get(`/api/v1/profiles/${xmtpId}`);
  return ConvosProfileForInboxSchema.parse(data);
};

export const fetchAllProfilesForUser = async ({
  convosUserId,
}: {
  convosUserId: string;
}): Promise<IConvosProfileForInbox[]> => {
  const { data } = await api.get(`/api/v1/profiles/user/${convosUserId}`);
  return z.array(ConvosProfileForInboxSchema).parse(data);
};

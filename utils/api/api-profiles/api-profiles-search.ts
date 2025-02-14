import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { api } from "@/utils/api/api";
import { getXmtpApiHeaders } from "@/utils/api/auth";
import { ApiError } from "@/utils/error";
import { z } from "zod";

const ProfileSearchBackendSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  xmtpId: z.string(),
});

type IProfileSearchBackendSchema = z.infer<typeof ProfileSearchBackendSchema>;

const ProfileSearchResponseSchema = z.array(ProfileSearchBackendSchema);

export type IProfileSearchResult = {
  id: string;
  name: string;
  description?: string;
  inboxId: string;
};

function mapBackendToProfileResult(
  profile: IProfileSearchBackendSchema
): IProfileSearchResult {
  return {
    id: profile.id,
    name: profile.name,
    description: profile.description,
    inboxId: profile.xmtpId,
  };
}

export async function searchProfilesForCurrentAccount({
  query,
}: {
  query: string;
}) {
  const currentAccount = getCurrentAccount()!;

  try {
    const { data } = await api.get("/api/profiles/search", {
      headers: await getXmtpApiHeaders(currentAccount),
      params: { query },
    });

    const parseResult = ProfileSearchResponseSchema.safeParse(data);

    if (!parseResult.success) {
      throw new ApiError(
        `[API PROFILES] searchProfilesForCurrentAccount parse error for query: ${query}`,
        parseResult.error
      );
    }

    return parseResult.data.map(mapBackendToProfileResult);
  } catch (error) {
    throw new ApiError(
      `[API PROFILES] searchProfilesForCurrentAccount failed for query: ${query}`,
      error
    );
  }
}

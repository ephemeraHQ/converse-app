import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import type { ProfileType } from "@/features/onboarding/types/onboarding.types";
import { logger } from "@/utils/logger";
import type { InboxId } from "@xmtp/react-native-sdk";
import { z } from "zod";
import { oldApi } from "./api";
import { getXmtpApiHeaders } from "./auth";

const LensHandleSchema = z.object({
  profileId: z.string(),
  handle: z.string(),
  isDefault: z.boolean(),
  name: z.string().optional(),
  profilePictureURI: z.string().optional(),
});
export type ILensHandleZodSchema = z.infer<typeof LensHandleSchema>;

const EnsNameSchema = z.object({
  name: z.string(),
  isPrimary: z.boolean(),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
});
export type IEnsNameZodSchema = z.infer<typeof EnsNameSchema>;

const FarcasterUsernameSchema = z.object({
  username: z.string(),
  name: z.string().optional(),
  avatarURI: z.string().optional(),
  linkedAccount: z.boolean().optional(),
});
export type IFarcasterUsernameZodSchema = z.infer<
  typeof FarcasterUsernameSchema
>;

const UnstoppableDomainSchema = z.object({
  domain: z.string(),
  isPrimary: z.boolean(),
});
export type IUnstoppableDomainZodSchema = z.infer<
  typeof UnstoppableDomainSchema
>;

const ConverseUserNameSchema = z.object({
  name: z.string(),
  isPrimary: z.boolean(),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
});
export type IConverseUserNameZodSchema = z.infer<typeof ConverseUserNameSchema>;

const ProfileSocialsSchema = z.object({
  address: z.string().optional(),
  ensNames: z.array(EnsNameSchema).optional(),
  farcasterUsernames: z.array(FarcasterUsernameSchema).optional(),
  lensHandles: z.array(LensHandleSchema).optional(),
  unstoppableDomains: z.array(UnstoppableDomainSchema).optional(),
  userNames: z.array(ConverseUserNameSchema).optional(),
});
export type IProfileSocialsZodSchema = z.infer<typeof ProfileSocialsSchema>;

export const hasNoProfiles = (profileSocials: IProfileSocials) => {
  const allProfilesWithoutAddress = Object.keys(profileSocials)
    // all properties other than address are profile lists
    .filter((key) => key !== "address")
    // now that address is gone, all other entries are profile lists
    // for a given web3 identity provider
    .map((key) => profileSocials[key as keyof IProfileSocials])
    // is every list is empty, the user has no profiles
    .every((profiles) => profiles && profiles.length === 0);
  logger.debug(
    "[API PROFILES] hasNoProfiles",
    JSON.stringify(profileSocials),
    allProfilesWithoutAddress
  );

  return allProfilesWithoutAddress;
};

const inboxIdProfileResponseSchema = z.record(
  z.string(),
  z.array(ProfileSocialsSchema)
);

const deprecatedProfileResponseSchema = z.record(
  z.string(),
  ProfileSocialsSchema
);

export type IProfileSocials = z.infer<typeof ProfileSocialsSchema>;

export const getProfilesForAddresses = async (addresses: string[]) => {
  const { data } = await oldApi.post("/api/profile/batch", {
    addresses,
  });
  const parseResult = deprecatedProfileResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API PROFILES] getProfilesForAddresses parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return parseResult.success ? parseResult.data : {};
};

export const getProfilesForInboxIds = async ({
  inboxIds,
}: {
  inboxIds: InboxId[];
}) => {
  const { data } = await oldApi.get("/api/inbox/", {
    params: { ids: inboxIds.join(",") },
  });
  const parseResult = inboxIdProfileResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API PROFILES] getProfilesForInboxIds parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return parseResult.success ? parseResult.data : {};
};

const ProfileSearchResponseSchema = z.record(z.string(), ProfileSocialsSchema);
type IProfileSearchResponse = z.infer<typeof ProfileSearchResponseSchema>;

export const searchProfilesForCurrentAccount = async (
  query: string
): Promise<IProfileSearchResponse> => {
  const currentAccount = getCurrentAccount()!;
  const { data } = await oldApi.get("/api/profile/search", {
    headers: await getXmtpApiHeaders(currentAccount),
    params: { query },
  });
  const parseResult = ProfileSearchResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API PROFILES] searchProfilesForCurrentAccount parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return parseResult.data || {};
};

const ClaimProfileResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const claimProfile = async ({
  account,
  profile,
}: {
  account: string;
  profile: ProfileType;
}) => {
  const { data } = await oldApi.post("/api/profile/username", profile, {
    headers: await getXmtpApiHeaders(account),
  });
  logger.debug("[API PROFILES] claimProfile response:", data);
  const parseResult = ClaimProfileResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API PROFILES] claimProfile parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return parseResult.success ? parseResult.data.success : false;
};

const UsernameValidResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const checkUsernameValid = async ({
  address,
  username,
}: {
  address:
    | string
    | /* address is undefined if you want to check only that a username is not taken/available */ undefined;
  username: string;
}) => {
  const { data } = await oldApi.get("/api/profile/username/valid", {
    params: { address, username },
  });
  logger.debug("[API PROFILES] checkUsernameValid response:", data);
  const parseResult = UsernameValidResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API PROFILES] checkUsernameValid parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return parseResult.success ? parseResult.data.success : false;
};

const EnsResolveResponseSchema = z.object({
  address: z.string().nullable(),
});
type IEnsResolveResponse = z.infer<typeof EnsResolveResponseSchema>;

export const resolveEnsName = async (
  name: string
): Promise<IEnsResolveResponse> => {
  const { data } = await oldApi.get("/api/profile/ens", { params: { name } });
  const parseResult = EnsResolveResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API PROFILES] resolveEnsName parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return parseResult.success
    ? { address: parseResult.data.address ?? null }
    : { address: null };
};

const UnsResolveResponseSchema = z.object({
  address: z.string().nullable(),
});

export const resolveUnsDomain = async (domain: string) => {
  const { data } = await oldApi.get("/api/profile/uns", { params: { domain } });
  const parseResult = UnsResolveResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API PROFILES] resolveUnsDomain parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return parseResult.success
    ? { address: parseResult.data.address ?? null }
    : { address: null };
};

const FarcasterResolveResponseSchema = z.object({
  address: z.string().nullable(),
});

export const resolveFarcasterUsername = async (username: string) => {
  const { data } = await oldApi.get("/api/profile/farcaster", {
    params: { username },
  });
  const parseResult = FarcasterResolveResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API PROFILES] resolveFarcasterUsername parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return parseResult.success
    ? { address: parseResult.data.address ?? null }
    : { address: null };
};

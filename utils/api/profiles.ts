import type { Frens } from "@/data/store/recommendationsStore";
import type { IProfileSocials } from "@/features/profiles/profile-types";
import type { ProfileType } from "@/screens/Onboarding/OnboardingUserProfileScreen";
import { evmHelpers } from "@/utils/evm/helpers";
import logger from "@/utils/logger";
import type { InboxId } from "@xmtp/react-native-sdk";
import { getXmtpApiHeaders } from "./auth";
import { api } from "./api";

export const getProfilesForAddresses = async (
  addresses: string[]
): Promise<{ [address: string]: IProfileSocials }> => {
  const { data } = await api.post("/api/profile/batch", {
    addresses,
  });
  return data;
};

export const getProfilesForInboxIds = async ({
  inboxIds,
}: {
  inboxIds: string[];
}): Promise<{ [inboxId: InboxId]: IProfileSocials[] }> => {
  logger.info("Fetching profiles for inboxIds", inboxIds);
  const { data } = await api.get("/api/inbox/", {
    params: { ids: inboxIds.join(",") },
  });
  return data;
};

export const searchProfiles = async (
  query: string,
  account: string
): Promise<{ [address: string]: IProfileSocials }> => {
  const { data } = await api.get("/api/profile/search", {
    headers: await getXmtpApiHeaders(account),
    params: { query },
  });
  return data;
};

export const findFrens = async (account: string) => {
  const { data } = await api.get("/api/frens/find", {
    headers: await getXmtpApiHeaders(account),
    params: { address: evmHelpers.toChecksumAddress(account) },
  });
  return data.frens as Frens;
};

export const claimProfile = async ({
  account,
  profile,
}: {
  account: string;
  profile: ProfileType;
}): Promise<string> => {
  const { data } = await api.post("/api/profile/username", profile, {
    headers: await getXmtpApiHeaders(account),
  });
  return data;
};

export const checkUsernameValid = async (
  address: string,
  username: string
): Promise<string> => {
  const { data } = await api.get("/api/profile/username/valid", {
    params: { address, username },
    headers: await getXmtpApiHeaders(address),
  });
  return data;
};

export const resolveEnsName = async (
  name: string
): Promise<string | undefined> => {
  const { data } = await api.get("/api/profile/ens", { params: { name } });
  return data.address;
};

export const resolveUnsDomain = async (
  domain: string
): Promise<string | undefined> => {
  const { data } = await api.get("/api/profile/uns", { params: { domain } });
  return data.address;
};

export const resolveFarcasterUsername = async (
  username: string
): Promise<string | undefined> => {
  const { data } = await api.get("/api/profile/farcaster", {
    params: { username },
  });
  return data.address;
};

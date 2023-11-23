import { ProfileSocials } from "../data/store/profilesStore";
import { RecommendationData } from "../data/store/recommendationsStore";
import { getLensHandleFromConversationIdAndPeer } from "./lens";
import { shortAddress } from "./str";

export const getProfileData = (
  recommendationData?: RecommendationData,
  socials?: ProfileSocials
): RecommendationData | undefined => {
  // We get the data from the recommendations part
  if (recommendationData) return recommendationData;
  // If not we get it from the profile part
  if (!socials) return undefined;
  const ens = socials.ensNames?.find((e) => e.isPrimary)?.name;
  const farcasterUsernames =
    socials.farcasterUsernames?.map((f) => f.username) || [];
  const lensHandles = socials.lensHandles?.map((l) => l.handle) || [];
  if (!ens && farcasterUsernames.length === 0 && lensHandles.length === 0)
    return undefined;
  return {
    tags: [],
    ens,
    farcasterUsernames,
    lensHandles,
  };
};

export function getPreferredName(
  socials: ProfileSocials | undefined,
  peerAddress: string,
  conversationId?: string | null
): string {
  const lensHandle =
    conversationId && socials?.lensHandles
      ? getLensHandleFromConversationIdAndPeer(
          conversationId,
          socials.lensHandles
        ) || null
      : null;

  const userName = socials?.userNames?.find((e) => e.isPrimary)?.name || null;
  const ensName = socials?.ensNames?.find((e) => e.isPrimary)?.name || null;
  const unsDomain =
    socials?.unstoppableDomains?.find((d) => d.isPrimary)?.domain || null;

  return (
    lensHandle || userName || ensName || unsDomain || shortAddress(peerAddress)
  );
}

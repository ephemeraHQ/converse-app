import {
  EnsName,
  FarcasterUsername,
  LensHandle,
  UnstoppableDomain,
  ConverseUserName,
  ProfileByAddress,
} from "../data/store/profilesStore";

export const getMatchedPeerAddresses = (
  profiles: ProfileByAddress,
  searchQuery: string
): string[] => {
  const results: string[] = [];
  const query = cleanStringForSearch(searchQuery);
  for (const [peerAddress, profile] of Object.entries(profiles)) {
    const checkMatch = (str: string | undefined): boolean => {
      if (str?.toLowerCase().includes(query)) {
        results.push(peerAddress);
        return true;
      }
      return false;
    };
    if (
      profile?.socials?.userNames?.some((userName: ConverseUserName) =>
        checkMatch(userName.name)
      )
    ) {
      continue;
    }
    if (
      profile?.socials?.ensNames?.some((ens: EnsName) => checkMatch(ens.name))
    ) {
      continue;
    }
    if (
      profile?.socials?.lensHandles?.some(
        (lens: LensHandle) => checkMatch(lens.name) || checkMatch(lens.handle)
      )
    ) {
      continue;
    }
    if (
      profile?.socials?.farcasterUsernames?.some(
        (farcaster: FarcasterUsername) =>
          checkMatch(farcaster.name) || checkMatch(farcaster.username)
      )
    ) {
      continue;
    }
    if (
      profile?.socials?.unstoppableDomains?.some(
        (unstoppable: UnstoppableDomain) => checkMatch(unstoppable.domain)
      )
    ) {
      continue;
    }
    if (checkMatch(peerAddress)) {
      continue;
    }
  }
  return results;
};

const cleanStringForSearch = (input: string): string => {
  const cleanedString = input.toLowerCase().trim();
  return cleanedString;
};

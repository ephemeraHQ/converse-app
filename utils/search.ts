import {
  EnsName,
  FarcasterUsername,
  LensHandle,
  UnstoppableDomain,
  ProfileByAddress,
} from "../data/store/profilesStore";

export const getMatchedPeerAddresses = (
  profiles: ProfileByAddress,
  searchQuery: string
): string[] => {
  const results: string[] = [];

  Object.entries(profiles).forEach(([peerAddress, profile]) => {
    const query = cleanStringForSearch(searchQuery);

    // console.log('clean query: ', query);
    // console.log('profile_key: ', peerAddress);
    // console.log('profile_data: ', JSON.stringify(profile, null, 2));

    let isMatchFound = false;

    if (peerAddress.toLowerCase().includes(query)) {
      isMatchFound = true;
    }

    profile?.socials?.ensNames?.forEach((ens: EnsName) => {
      if (ens.name.toLowerCase().includes(query)) {
        isMatchFound = true;
      }
    });

    profile?.socials?.lensHandles?.forEach((lens: LensHandle) => {
      if (
        lens.name?.toLowerCase().includes(query) ||
        lens.handle.toLowerCase().includes(query)
      ) {
        isMatchFound = true;
      }
    });

    profile?.socials?.farcasterUsernames?.forEach(
      (farcaster: FarcasterUsername) => {
        if (
          farcaster.name?.toLowerCase().includes(query) ||
          farcaster.username.toLowerCase().includes(query)
        ) {
          isMatchFound = true;
        }
      }
    );

    profile?.socials?.unstoppableDomains?.forEach(
      (unstoppable: UnstoppableDomain) => {
        if (unstoppable.domain.toLowerCase().includes(query)) {
          isMatchFound = true;
        }
      }
    );

    if (isMatchFound) {
      results.push(peerAddress);
    }
  });

  return results;
};

const cleanStringForSearch = (input: string): string => {
  let cleanedString = input.toLowerCase(); // Converts to lowercase
  cleanedString = cleanedString.replace(/^\s+|\s+$/g, ""); // Removes leading and trailing spaces

  return cleanedString;
};

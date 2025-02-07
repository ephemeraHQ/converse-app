/**
 * TODO: Maybe move to profile socials utils once we have refactored profile socials
 */

import type { IProfileSocials } from "@/features/profiles/profile-types";

export function doesSocialsMatchQuery(args: {
  socials: IProfileSocials[];
  normalizedQuery: string;
}) {
  const { socials, normalizedQuery } = args;

  return socials.some((profile) => {
    return [
      // Check address
      profile.address?.toLowerCase().includes(normalizedQuery),
      // Check ENS
      profile.ensNames?.some(
        (ens) =>
          ens.name.toLowerCase().includes(normalizedQuery) ||
          ens.displayName?.toLowerCase()?.includes(normalizedQuery)
      ),
      // Check Lens
      profile.lensHandles?.some(
        (lens) =>
          lens.handle.toLowerCase().includes(normalizedQuery) ||
          lens.name?.toLowerCase()?.includes(normalizedQuery)
      ),
      // Check Farcaster
      profile.farcasterUsernames?.some(
        (fc) =>
          fc.username.toLowerCase().includes(normalizedQuery) ||
          fc.name?.toLowerCase()?.includes(normalizedQuery)
      ),
      // Check Unstoppable Domains
      profile.unstoppableDomains?.some((ud) =>
        ud.domain.toLowerCase().includes(normalizedQuery)
      ),
      // Check usernames
      profile.userNames?.some(
        (un) =>
          un.name.toLowerCase().includes(normalizedQuery) ||
          un.displayName?.toLowerCase()?.includes(normalizedQuery)
      ),
    ].some(Boolean);
  });
}

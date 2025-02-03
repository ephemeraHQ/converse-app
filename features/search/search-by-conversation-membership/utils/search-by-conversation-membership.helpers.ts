import type { IProfileSocials } from "@/features/profiles/profile-types";

export function doesGroupNameMatchQuery(
  groupName: string | undefined,
  normalizedQuery: string
) {
  return !!groupName?.toLowerCase().includes(normalizedQuery);
}

export function doesMemberProfileMatchQuery(args: {
  profile: IProfileSocials | null;
  normalizedQuery: string;
}) {
  const { profile, normalizedQuery } = args;

  if (!profile) {
    return false;
  }

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
}

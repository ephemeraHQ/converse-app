import { type IProfileSocials } from "@/features/profiles/profile-types";
import { shortAddress } from "../strings/shortAddress";

export function getPrimaryNames(
  socials: IProfileSocials | undefined
): string[] {
  if (!socials) {
    return [];
  }

  const primaryNames: string[] = [];
  const ethAddress = socials.cryptoCurrencyWalletAddresses?.ETH?.[0];
  if (socials.userNames) {
    primaryNames.push(
      ...socials.userNames.filter((u) => u.isPrimary).map((u) => u.name)
    );
  }
  if (socials.ensNames) {
    primaryNames.push(
      ...socials.ensNames.filter((e) => e.isPrimary).map((e) => e.name)
    );
  }
  if (socials.unstoppableDomains) {
    primaryNames.push(
      ...socials.unstoppableDomains
        .filter((d) => d.isPrimary)
        .map((d) => d.domain)
    );
  }
  if (socials.farcasterUsernames) {
    primaryNames.push(
      ...socials.farcasterUsernames
        .filter((f) => f.username)
        .map((f) => `${f.username} on farcaster`)
    );
  }
  if (socials.lensHandles) {
    primaryNames.push(
      ...socials.lensHandles
        .filter((l) => l.handle)
        .map((l) => `${l.handle} on lens`)
    );
  }
  if (ethAddress) {
    primaryNames.push(shortAddress(ethAddress));
  }

  return primaryNames;
}

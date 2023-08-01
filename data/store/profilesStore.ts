export type LensHandle = {
  profileId: string;
  handle: string;
  isDefault: boolean;
  name?: string;
  profilePictureURI?: string;
};

export type EnsName = {
  name: string;
  isPrimary: boolean;
};

export type FarcasterUsername = {
  username: string;
  name?: string;
  avatarURI?: string;
};

export type UnstoppableDomain = {
  domain: string;
  isPrimary: boolean;
};

export type ProfileSocials = {
  ensNames?: EnsName[];
  farcasterUsernames?: FarcasterUsername[];
  lensHandles?: LensHandle[];
  unstoppableDomains?: UnstoppableDomain[];
};

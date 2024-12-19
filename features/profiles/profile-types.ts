export type ILensHandle = {
  profileId: string;
  handle: string;
  isDefault: boolean;
  name?: string;
  profilePictureURI?: string;
};

export type IEnsName = {
  name: string;
  isPrimary: boolean;
  displayName?: string | undefined;
  avatar?: string | undefined;
};

export type IFarcasterUsername = {
  username: string;
  name?: string;
  avatarURI?: string;
  linkedAccount?: boolean;
};

export type IUnstoppableDomain = {
  domain: string;
  isPrimary: boolean;
};

export type IConverseUserName = {
  name: string;
  isPrimary: boolean;
  displayName?: string | undefined;
  avatar?: string | undefined;
};

export type IProfileSocials = {
  address?: string;
  ensNames?: IEnsName[];
  farcasterUsernames?: IFarcasterUsername[];
  lensHandles?: ILensHandle[];
  unstoppableDomains?: IUnstoppableDomain[];
  userNames?: IConverseUserName[];
};

export type ProfileByAddress = {
  [address: string]:
    | { socials: IProfileSocials; updatedAt: number }
    | undefined;
};

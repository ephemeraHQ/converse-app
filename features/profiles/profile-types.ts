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

export const Cryptocurrencies = {
  ETH: "ETH",
  // to add later!
  // SOL: "SOL",
  // BTC: "BTC",
  // SUI: "SUI",
} as const;

export type CryptoCurrency =
  (typeof Cryptocurrencies)[keyof typeof Cryptocurrencies];

export type CryptoCurrencyWalletAddresses = {
  [key in CryptoCurrency]: Array<string>;
};

export type IProfileSocials = {
  // address?: string;
  // note(lustig) this may be overkill for now, but I think preparing for the future
  // is a good idea.
  cryptoCurrencyWalletAddresses?: CryptoCurrencyWalletAddresses;
  ensNames?: IEnsName[];
  farcasterUsernames?: IFarcasterUsername[];
  lensHandles?: ILensHandle[];
  unstoppableDomains?: IUnstoppableDomain[];
  userNames?: IConverseUserName[];
};

export type ProfileByInboxId = {
  [inboxId: string]:
    | { socials: IProfileSocials; updatedAt: number }
    | undefined;
};

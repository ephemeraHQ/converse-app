export type ILensData = {
  profileId: string;
  handle: string;
  isDefault: boolean;
  name?: string;
  profilePictureURI?: string;
};

export type IEnsData = {
  name: string;
  isPrimary: boolean;
  displayName?: string | undefined;
  avatar?: string | undefined;
};

export type IFarcasterData = {
  username: string;
  name?: string;
  avatarURI?: string;
  linkedAccount?: boolean;
};

export type IUnstoppableDomainData = {
  domain: string;
  isPrimary: boolean;
};

export type IConverseUserData = {
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

export type Cryptocurrency =
  (typeof Cryptocurrencies)[keyof typeof Cryptocurrencies];

export type CryptocurrencyWalletAddresses = {
  [key in Cryptocurrency]: Array<string>;
};

export type IProfileSocials = {
  // address?: string;
  // note(lustig) this may be overkill for now, but I think preparing for the future
  // is a good idea.
  cryptoCurrencyWalletAddresses: CryptocurrencyWalletAddresses;
  ensNames?: IEnsData[];
  farcasterUsernames?: IFarcasterData[];
  lensHandles?: ILensData[];
  unstoppableDomains?: IUnstoppableDomainData[];
  userNames?: IConverseUserData[];
};

export type ProfileByInboxId = {
  [inboxId: string]:
    | { socials: IProfileSocials; updatedAt: number }
    | undefined;
};

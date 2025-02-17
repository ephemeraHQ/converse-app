import {
  Signer as XmtpSigner,
  Client as XmtpClient,
} from "@xmtp/react-native-sdk";

export const MultiInboxClientRestorationStates = {
  idle: "idle",
  restoring: "restoring",
  restored: "restored",
  error: (msg: string) => ({ error: msg }),
} as const;

type ValueOf<T> = T[keyof T];

type StaticStates = Exclude<
  ValueOf<typeof MultiInboxClientRestorationStates>,
  Function
>;

export type MultiInboxClientRestorationState =
  | StaticStates
  | ReturnType<typeof MultiInboxClientRestorationStates.error>;

export type CurrentSender = {
  ethereumAddress: string;
  inboxId: string;
};

export type ClientWithInvalidInstallation = undefined;

export type InboxClient =
  /** we're soon going to abstract xmtp client, for now just alias */ XmtpClient;

export type InboxSigner =
  /** we're soon going to abstract xmtp client, for now just alias */ XmtpSigner;

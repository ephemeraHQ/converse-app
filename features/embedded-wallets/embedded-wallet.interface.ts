import { Client } from "@xmtp/react-native-sdk";
import { LocalAccount } from "viem/accounts";

type Account = LocalAccount<any>;

export type IEmbeddedWallet = {
  account: Account | null;

  createAccount: () => Promise<Account>;

  loadAccount: () => Promise<Account>;

  xmtpClient: Client | null;

  instantiateXmtpClient: () => Promise<Client>;
};

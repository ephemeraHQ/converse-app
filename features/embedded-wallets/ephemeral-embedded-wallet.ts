import { IEmbeddedWallet } from "./embedded-wallet.interface";
import { Client } from "@xmtp/react-native-sdk";
import {
  generatePrivateKey,
  LocalAccount,
  privateKeyToAccount,
} from "viem/accounts";
import {
  copyDatabasesToTemporaryDirectory,
  createTemporaryDirectory,
} from "@/utils/fileSystem";
import { getDbEncryptionKey } from "@/utils/keychain/helpers";
import { getInboxId } from "@/utils/xmtpRN/signIn";
import { viemSignerToXmtpSigner } from "@/utils/xmtpRN/signer";

export class EphemeralEmbeddedWallet implements IEmbeddedWallet {
  account: LocalAccount<"privateKey"> | null = null;
  xmtpClient: Client | null = null;

  constructor(public readonly address: string) {}

  async createAccount() {
    const privateKey = generatePrivateKey();

    // 2. Create an account from the private key
    const account = privateKeyToAccount(privateKey);
    return account;
  }

  async loadAccount() {
    return this.account;
  }

  async instantiateXmtpClient() {
    if (!this.account) {
      throw new Error("Client not found");
    }
    const tempDirectory = await createTemporaryDirectory();
    const dbEncryptionKey = await getDbEncryptionKey();
    const options = {
      env: "dev",
      enableV3: true,
      dbDirectory: tempDirectory,
      dbEncryptionKey,
    } as const;
    const inboxId = await getInboxId(this.account.address);

    await copyDatabasesToTemporaryDirectory(tempDirectory, inboxId);
    const xmptClient = await Client.create(
      viemSignerToXmtpSigner(this.account),
      options
    );
    return xmptClient;
  }
}

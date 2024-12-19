import { onPasskeyCreate } from "@/utils/passkeys/createPasskey";
import { IEmbeddedWallet } from "./embedded-wallet.interface";
import { Client } from "@xmtp/react-native-sdk";
import { LocalAccount } from "viem/accounts";
import {
  copyDatabasesToTemporaryDirectory,
  createTemporaryDirectory,
} from "@/utils/fileSystem";
import { getDbEncryptionKey } from "@/utils/keychain/helpers";
import { getInboxId } from "@/utils/xmtpRN/signIn";
import { viemSignerToXmtpSigner } from "@/utils/xmtpRN/signer";

export class TurnkeyEmbeddedWallet implements IEmbeddedWallet {
  client: LocalAccount | null = null;
  xmtpClient: Client | null = null;

  constructor(public readonly address: string) {}

  async createClient() {
    const client = await onPasskeyCreate();
    if (!client) {
      throw new Error("Failed to create client");
    }
    return client;
  }

  async loadClient() {
    // return new LocalAccount(this.address);
  }

  async instantiateXmtpClient() {
    if (!this.client) {
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
    const inboxId = await getInboxId(this.client.address);

    await copyDatabasesToTemporaryDirectory(tempDirectory, inboxId);
    const xmptClient = await Client.create(
      viemSignerToXmtpSigner(this.client),
      options
    );
    return xmptClient;
  }
}

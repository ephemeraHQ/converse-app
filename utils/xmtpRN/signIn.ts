import {
  copyDatabasesToTemporaryDirectory,
  createTemporaryDirectory,
  moveTemporaryDatabasesToDatabaseDirecory,
} from "@utils/fileSystem";
import { getDbEncryptionKey } from "@utils/keychain/helpers";
import { sentryAddBreadcrumb } from "@utils/sentry";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import {
  Client,
  GroupUpdatedCodec,
  ReactionCodec,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";
import { Signer } from "ethers";

import { CoinbaseMessagingPaymentCodec } from "./contentTypes/coinbasePayment";
import config from "../../config";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getXmtpBase64KeyFromSigner = async (
  signer: Signer,
  preCreateIdentityCallback?: () => Promise<void>,
  preEnableIdentityCallback?: () => Promise<void>
) => {
  const tempDirectory = await createTemporaryDirectory();
  await copyDatabasesToTemporaryDirectory(tempDirectory);
  const dbEncryptionKey = await getDbEncryptionKey();
  sentryAddBreadcrumb("Instantiating client from signer");

  const client = await Client.create(signer, {
    env,
    codecs: [
      new TextCodec(),
      new ReactionCodec(),
      new ReadReceiptCodec(),
      new GroupUpdatedCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new StaticAttachmentCodec(),
      new TransactionReferenceCodec(),
      new CoinbaseMessagingPaymentCodec(),
    ],
    preCreateIdentityCallback,
    preEnableIdentityCallback,
    enableV3: true,
    dbDirectory: tempDirectory,
    dbEncryptionKey,
  });

  sentryAddBreadcrumb("Instantiated client from signer, exporting key bundle");
  const base64Key = await client.exportKeyBundle();
  // This Client is only be used to extract the key, we can disconnect
  // it to prevent locks happening during Onboarding
  await client.dropLocalDatabaseConnection();
  await moveTemporaryDatabasesToDatabaseDirecory(tempDirectory, client.inboxId);
  sentryAddBreadcrumb("Exported key bundle");
  return base64Key;
};

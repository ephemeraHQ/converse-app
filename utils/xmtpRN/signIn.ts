import { getDbEncryptionKey } from "@utils/keychain/helpers";
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
import { getDbDirectory } from "../../data/db";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getXmtpBase64KeyFromSigner = async (
  signer: Signer,
  preCreateIdentityCallback?: () => Promise<void>,
  preEnableIdentityCallback?: () => Promise<void>
) => {
  const dbDirectory = await getDbDirectory();
  const dbEncryptionKey = await getDbEncryptionKey();

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
    dbDirectory,
    dbEncryptionKey,
    historySyncUrl: config.historySyncUrl,
  });
  const base64Key = await client.exportKeyBundle();
  return base64Key;
};

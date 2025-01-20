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
import { InstallationId } from "@xmtp/react-native-sdk/build/lib/Client";
import { config } from "../../../config";
import { getDbDirectory } from "../../../data/db";
import { CoinbaseMessagingPaymentCodec } from "../content-types/coinbasePayment";
import { ConverseXmtpClientType } from "./client.types";

const codecs = [
  new TextCodec(),
  new ReactionCodec(),
  new ReadReceiptCodec(),
  new GroupUpdatedCodec(),
  new ReplyCodec(),
  new RemoteAttachmentCodec(),
  new StaticAttachmentCodec(),
  new TransactionReferenceCodec(),
  new CoinbaseMessagingPaymentCodec(),
];

export const getXmtpClientFromAddress = async (address: string) => {
  const dbDirectory = await getDbDirectory();
  const dbEncryptionKey = await getDbEncryptionKey();

  return Client.build(address, {
    env: config.xmtpEnv,
    codecs,
    dbDirectory,
    dbEncryptionKey,
  });
};

export const xmtpClientByAccount: {
  [account: string]: ConverseXmtpClientType;
} = {};

export const reconnectXmtpClientsDbConnections = async () => {
  await Promise.all(
    Object.values(xmtpClientByAccount).map((c) => c.reconnectLocalDatabase())
  );
};

export function dropXmtpClient(installationId: InstallationId) {
  return Client.dropClient(installationId);
}

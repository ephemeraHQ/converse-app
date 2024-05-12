import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import { privateKey } from "@xmtp/proto";
import {
  Client,
  GroupChangeCodec,
  ReactionCodec,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";
import { PrivateKeyBundleV1 } from "@xmtp/xmtp-js";
import { Platform } from "react-native";
import RNFS from "react-native-fs";

import config from "../../config";
import { getCleanAddress } from "../eth";
import { CoinbaseMessagingPaymentCodec } from "./contentTypes/coinbasePayment";

const env = config.xmtpEnv as "dev" | "production" | "local";

const getAddressFromBase64Key = (base64Key: string) => {
  const privateKeyBundleProto = privateKey.PrivateKeyBundle.decode(
    Buffer.from(base64Key, "base64")
  );
  if (!privateKeyBundleProto.v1) throw new Error("PrivateKeyBundleV1 missing");
  const privateKeyBundleV1 = new PrivateKeyBundleV1(privateKeyBundleProto.v1);
  const address = privateKeyBundleV1
    .getPublicKeyBundle()
    .walletSignatureAddress();
  return address;
};

export const getXmtpClientFromBase64Key = async (base64Key: string) => {
  const address = getAddressFromBase64Key(base64Key);
  const dbFilename = `xmtp-${config.xmtpEnv}-${address}.db3`;
  // @todo => use helper method for dbDirectory ?
  // URL.documentsDirectory.appendingPathComponent("xmtp-\(options?.api.env.rawValue ?? "")-\(address).db3")
  const dbDirectory =
    Platform.OS === "ios"
      ? await RNFS.pathForGroup(config.appleAppGroup)
      : `/data/data/${config.bundleId}/databases`;
  const dbPath = `${dbDirectory}/${dbFilename}`;
  return Client.createFromKeyBundle(base64Key, {
    env,
    codecs: [
      new TextCodec(),
      new ReactionCodec(),
      new ReadReceiptCodec(),
      new GroupChangeCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
      new StaticAttachmentCodec(),
      new TransactionReferenceCodec(),
      new CoinbaseMessagingPaymentCodec(),
    ],
    enableAlphaMls: true,
    // @todo => use getDbDirectory when we're merged with other branch?
    // discuss with XMTP the fact that we store the data inside the shared container
    dbPath,
    // @todo => use another key!!
    dbEncryptionKey: Buffer.from(base64Key, "base64").subarray(0, 32),
  });
};

export type ConverseXmtpClientType = Awaited<
  ReturnType<typeof getXmtpClientFromBase64Key>
>;

export type ConversationWithCodecsType = Awaited<
  ReturnType<ConverseXmtpClientType["conversations"]["newConversation"]>
>;

export type GroupWithCodecsType = Awaited<
  ReturnType<ConverseXmtpClientType["conversations"]["newGroup"]>
>;

export type DecodedMessageWithCodecsType = Awaited<
  ReturnType<ConversationWithCodecsType["messages"]>
>[number];

export const isOnXmtp = async (address: string) =>
  Client.canMessage(getCleanAddress(address), {
    env,
    // @todo => no need for dbEncryptionKey !!
    dbEncryptionKey: new Uint8Array([
      1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5,
      1, 2, 3, 4, 5, 1, 2,
    ]),
  });

export const xmtpClientByAccount: {
  [account: string]: ConverseXmtpClientType;
} = {};

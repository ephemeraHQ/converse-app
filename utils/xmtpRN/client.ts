import { useCurrentAccount } from "@data/store/accountsStore";
import { awaitableAlert } from "@utils/alert";
import { getDbEncryptionKey } from "@utils/keychain/helpers";
import logger from "@utils/logger";
import { useLogoutFromConverse } from "@utils/logout";
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
import { useEffect, useRef } from "react";

import { CoinbaseMessagingPaymentCodec } from "./contentTypes/coinbasePayment";
import { getXmtpClient } from "./sync";
import config from "../../config";
import { getDbDirectory } from "../../data/db";
import { getCleanAddress } from "../eth";

const env = config.xmtpEnv as "dev" | "production" | "local";

export const getXmtpClientFromBase64Key = async (base64Key: string) => {
  const dbDirectory = await getDbDirectory();
  const dbEncryptionKey = await getDbEncryptionKey();

  return Client.createFromKeyBundle(base64Key, {
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
    enableV3: true,
    dbDirectory,
    dbEncryptionKey,
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
  });

export const xmtpClientByAccount: {
  [account: string]: ConverseXmtpClientType;
} = {};

// On iOS, it's important to stop writing to SQLite database
// when the app is going from BACKGROUNDED to SUSPENDED
// (see https://github.com/xmtp/xmtp-ios/issues/336)

// There are currently 2 SQLite databases:
// 1st one managed by Converse, created to store v2 XMTP data
// 2nd one managed by LibXMTP, created to store v3 XMTP data

// Let's just stop writing to both of them as soon as the app is BACKGROUNDED

export const dropXmtpClientsDbConnections = async () => {
  await Promise.all(
    Object.values(xmtpClientByAccount).map((c) =>
      c.dropLocalDatabaseConnection()
    )
  );
};

export const reconnectXmtpClientsDbConnections = async () => {
  await Promise.all(
    Object.values(xmtpClientByAccount).map((c) => c.reconnectLocalDatabase())
  );
};

export const useCheckCurrentInstallation = () => {
  const account = useCurrentAccount() as string;
  const logout = useLogoutFromConverse(account);
  // To make sure we're checking only once
  const accountCheck = useRef<string | undefined>(undefined);
  useEffect(() => {
    const check = async () => {
      if (!account) return;
      if (accountCheck.current === account) return;
      accountCheck.current = account;
      const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
      const inboxState = await client.inboxState(true);
      if (!inboxState.installationIds.includes(client.installationId)) {
        logger.warn(`Installation ${client.installationId} has been revoked`);
        await awaitableAlert(
          "Installation revoked",
          "The current installation has been revoked, you will now get logged out and group chats will be deleted"
        );
        logout(true);
        accountCheck.current = undefined;
      } else {
        logger.debug(`Installation ${client.installationId} is not revoked`);
      }
    };
    check().catch((e) => {
      accountCheck.current = undefined;
      logger.warn(e, {
        error: `Could not check inbox state for ${account}`,
      });
    });
  }, [account, logout]);
};

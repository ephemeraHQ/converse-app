import { useCurrentAccount } from "@data/store/accountsStore";
import { translate } from "@i18n";
import { awaitableAlert } from "@utils/alert";
import { getDbEncryptionKey } from "@utils/keychain/helpers";
import logger from "@utils/logger";
import { useLogoutFromConverse } from "@utils/logout";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import {
  Client,
  Conversation,
  Dm,
  Group,
  GroupUpdatedCodec,
  ReactionCodec,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";
import { useEffect, useRef } from "react";
import { InstallationId } from "@xmtp/react-native-sdk/build/lib/Client";
import config from "../../config";
import { getDbDirectory } from "../../data/db";
import { CoinbaseMessagingPaymentCodec } from "./contentTypes/coinbasePayment";
import { getXmtpClient } from "./sync";

const env = config.xmtpEnv as "dev" | "production" | "local";

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

export type SupportedCodecsType = [
  TextCodec,
  ReactionCodec,
  ReadReceiptCodec,
  GroupUpdatedCodec,
  ReplyCodec,
  RemoteAttachmentCodec,
  StaticAttachmentCodec,
  TransactionReferenceCodec,
  CoinbaseMessagingPaymentCodec,
];

export const getXmtpClientFromAddress = async (address: string) => {
  const dbDirectory = await getDbDirectory();
  const dbEncryptionKey = await getDbEncryptionKey();

  return Client.build(address, {
    env,
    codecs,
    dbDirectory,
    dbEncryptionKey,
  });
};

export type ConverseXmtpClientType = Client<SupportedCodecsType>;

export type ConversationWithCodecsType = Conversation<SupportedCodecsType>;

export type GroupWithCodecsType = Group<SupportedCodecsType>;

export type DmWithCodecsType = Dm<SupportedCodecsType>;

export type DecodedMessageWithCodecsType = Awaited<
  ReturnType<ConversationWithCodecsType["messages"]>
>[number];

export type SendMessageWithCodecs = Parameters<
  ConversationWithCodecsType["send"]
>;

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

export const isClientInstallationValid = async (client: Client) => {
  const inboxState = await client.inboxState(true);
  const installationsIds = inboxState.installations.map((i) => i.id);
  logger.debug(
    `Current installation id : ${client.installationId} - All installation ids : ${installationsIds}`
  );
  if (!installationsIds.includes(client.installationId)) {
    logger.warn(`Installation ${client.installationId} has been revoked`);
    return false;
  } else {
    logger.debug(`Installation ${client.installationId} is not revoked`);
    return true;
  }
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
      const client = (await getXmtpClient(account)) as Client;
      const installationValid = await isClientInstallationValid(client);

      if (!installationValid) {
        await awaitableAlert(
          translate("current_installation_revoked"),
          translate("current_installation_revoked_description")
        );
        logout(true);
        accountCheck.current = undefined;
      }
    };
    check().catch(async (e) => {
      if (
        `${e}`.includes(
          "No v3 keys found, you must pass a SigningKey in order to enable alpha MLS features"
        )
      ) {
        logout(true, false);
        accountCheck.current = undefined;
      }
      accountCheck.current = undefined;
      logger.warn(e, {
        error: `Could not check inbox state for ${account}`,
      });
    });
  }, [account, logout]);
};

export const dropXmtpClient = (installationId: InstallationId) =>
  Client.dropClient(installationId);

export const requestMessageHistorySync = async (
  client: ConverseXmtpClientType
) => client.requestMessageHistorySync();

export const requestMessageHistorySyncByAccount = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    throw new Error("Client not found");
  }
  await requestMessageHistorySync(client);
};

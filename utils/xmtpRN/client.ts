import { useCurrentInboxId } from "@data/store/accountsStore";
import { translate } from "@i18n";
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
import { InstallationId } from "@xmtp/react-native-sdk/build/lib/Client";
import config from "../../config";
import { getDbDirectory } from "../../data/db";
import { CoinbaseMessagingPaymentCodec } from "./content-types/coinbasePayment";
import { ConverseXmtpClientType } from "./client.types";

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

export const buildXmtpClientFromAddress = async (
  address: string
): Promise<Client> => {
  const dbDirectory = await getDbDirectory();
  const dbEncryptionKey = await getDbEncryptionKey();

  const c = await Client.build(address, {
    env,
    codecs,
    dbDirectory,
    dbEncryptionKey,
  });
  return c;
};

export const xmtpClientByAccount: {
  [account: string]: ConverseXmtpClientType;
} = {};
export const xmtpClientByInboxId: {
  [inboxId: string]: ConverseXmtpClientType;
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
    Object.values(xmtpClientByInboxId).map((c) =>
      c.dropLocalDatabaseConnection()
    )
  );
};

export const reconnectXmtpClientsDbConnections = async () => {
  await Promise.all(
    Object.values(xmtpClientByInboxId).map((c) => c.reconnectLocalDatabase())
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
  // const account = useCurrentAccount() as string;
  const inboxId = useCurrentInboxId() as string;
  const logout = useLogoutFromConverse({ inboxId });
  // To make sure we're checking only once
  const accountCheck = useRef<string | undefined>(undefined);
  useEffect(() => {
    const check = async () => {
      if (!inboxId) return;
      if (accountCheck.current === inboxId) return;
      accountCheck.current = inboxId;
      const client = xmtpClientByInboxId[inboxId];
      if (!client) {
        logout({ dropLocalDatabase: true });
        accountCheck.current = undefined;
        return;
      }
      const installationValid = await isClientInstallationValid(client);

      if (!installationValid) {
        await awaitableAlert(
          translate("current_installation_revoked"),
          translate("current_installation_revoked_description")
        );
        logout({ dropLocalDatabase: true });
        accountCheck.current = undefined;
      }
    };
    check().catch(async (e) => {
      if (
        `${e}`.includes(
          "No v3 keys found, you must pass a SigningKey in order to enable alpha MLS features"
        )
      ) {
        logout({ dropLocalDatabase: true });
        accountCheck.current = undefined;
      }
      accountCheck.current = undefined;
      logger.warn(e, {
        error: `Could not check inbox state for ${inboxId}`,
      });
    });
  }, [inboxId, logout]);
};

export const dropXmtpClient = (installationId: InstallationId) =>
  Client.dropClient(installationId);

export const requestMessageHistorySync = async (
  client: ConverseXmtpClientType
) => client.requestMessageHistorySync();

export type InstallationSignature = {
  installationPublicKey: string;
  installationKeySignature: string;
};

export async function getInstallationKeySignature({
  inboxId,
  messageToSign,
}: {
  inboxId: string;
  messageToSign: string;
}): Promise<InstallationSignature> {
  const client = xmtpClientByInboxId[inboxId];
  if (!client)
    throw new Error("[client#getInstallationKeySignature] Client not found");

  const raw = await client.signWithInstallationKey(messageToSign);

  return {
    installationPublicKey: client.installationId,
    installationKeySignature: Buffer.from(raw).toString("hex"),
  };
}

import { Signer } from "ethers";
import { Alert } from "react-native";

import { prefetchInboxIdQuery } from "@/queries/use-inbox-id-query";
import {
  getSettingsStore,
  getWalletStore,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { translate } from "../../i18n";
import { awaitableAlert } from "../../utils/alert";
import logger from "../../utils/logger";
import { logoutAccount, waitForLogoutTasksDone } from "../../utils/logout";
import { sentryTrackMessage } from "../../utils/sentry";
import {
  createXmtpClientFromSigner,
  getInboxIdFromCryptocurrencyAddress,
} from "../../utils/xmtpRN/signIn";
import { getOrBuildXmtpClient } from "../../utils/xmtpRN/sync";

export async function initXmtpClient(args: {
  signer: Signer;
  address: string;
  isEphemeral?: boolean;
  pkPath?: string;
}) {
  const { signer, address, ...restArgs } = args;
  const inboxId = await getInboxIdFromCryptocurrencyAddress({
    address,
    cryptocurrency: "ETH",
  });

  if (!signer || !address) {
    throw new Error("No signer or address");
  }

  try {
    const onInstallationRevoked = async () => {
      await awaitableAlert(
        translate("current_installation_revoked"),
        translate("current_installation_revoked_description")
      );
      throw new Error("Current installation revoked");
    };

    const xmtpClientCreationResult = await createXmtpClientFromSigner(
      signer,
      onInstallationRevoked
    );

    if ("error" in xmtpClientCreationResult) {
      throw xmtpClientCreationResult.error;
    }

    await connectWithInboxId({
      inboxId,
      address,
      ...restArgs,
    });
  } catch (e) {
    await logoutAccount({ inboxId, dropLocalDatabase: false });
    logger.error(e);
    throw e;
  }
}

type IBaseArgs = {
  inboxId: string;
};

type IEphemeralArgs = IBaseArgs & {
  isEphemeral: true;
};

type IPrivateKeyArgs = IBaseArgs & {
  pkPath: string;
};

type IStandardArgs = IBaseArgs;

type IConnectWithAddressKeyArgs =
  | IEphemeralArgs
  | IPrivateKeyArgs
  | IStandardArgs;

export async function connectWithInboxId(args: IConnectWithAddressKeyArgs) {
  const { inboxId } = args;

  logger.debug("In connectWithInboxId");

  if (!inboxId) {
    sentryTrackMessage("Could not connect because no inboxId");
    return;
  }

  try {
    await performLogoutAndSaveKey();

    useAccountsStore.getState().setCurrentInboxId({
      inboxId,
      createIfNew: true,
    });
    await finalizeAccountSetup(args);
    sentryTrackMessage("Connecting done!");
  } catch (e) {
    logger.error(e, { context: "Onboarding - connectWithInboxId" });
    Alert.alert(translate("onboarding_error"));
    throw e;
  }
}

async function performLogoutAndSaveKey() {
  logger.debug("Waiting for logout tasks");
  await waitForLogoutTasksDone(500);
  logger.debug("Logout tasks done, saving xmtp key");
  logger.debug("XMTP Key saved");
}

async function finalizeAccountSetup(args: IConnectWithAddressKeyArgs) {
  logger.debug("Finalizing account setup");

  const { inboxId } = args;

  useAccountsStore.getState().setCurrentInboxId({
    inboxId,
    createIfNew: false,
  });

  getSettingsStore({ inboxId })
    .getState()
    .setEphemeralAccount("isEphemeral" in args && args.isEphemeral);

  if ("pkPath" in args) {
    getWalletStore({ inboxId }).getState().setPrivateKeyPath(args.pkPath);
  }

  getOrBuildXmtpClient({ account: address });

  logger.debug("Account setup finalized");
}

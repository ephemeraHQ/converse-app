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
import { createXmtpClientFromSigner } from "../../utils/xmtpRN/signIn";
import { getOrBuildXmtpClient } from "../../utils/xmtpRN/sync";

export async function initXmtpClient(args: {
  signer: Signer;
  address: string;
  isEphemeral?: boolean;
  pkPath?: string;
}) {
  const { signer, address, ...restArgs } = args;

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

    await createXmtpClientFromSigner(signer, onInstallationRevoked);

    await connectWithAddress({
      address,
      ...restArgs,
    });
  } catch (e) {
    await logoutAccount(address, false, true, () => {});
    logger.error(e);
    throw e;
  }
}

type IBaseArgs = {
  address: string;
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

export async function connectWithAddress(args: IConnectWithAddressKeyArgs) {
  const { address, inboxId } = args;

  logger.debug("In connectWithAddress");

  if (!address) {
    sentryTrackMessage("Could not connect because no address");
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
    logger.error(e, { context: "Onboarding - connectWithAddress" });
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

  const { address, inboxId } = args;

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

  await prefetchInboxIdQuery({ account: address });

  getOrBuildXmtpClient({ account: address });

  logger.debug("Account setup finalized");
}

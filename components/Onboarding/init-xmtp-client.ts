import { Signer } from "ethers";
import { Alert } from "react-native";

import { initDb } from "../../data/db";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  getSettingsStore,
  getWalletStore,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { translate } from "../../i18n";
import { awaitableAlert } from "../../utils/alert";
import { saveXmtpKey } from "../../utils/keychain/helpers";
import logger from "../../utils/logger";
import { logoutAccount, waitForLogoutTasksDone } from "../../utils/logout";
import { sentryTrackMessage } from "../../utils/sentry";
import { createXmtpClientFromSigner } from "../../utils/xmtpRN/signIn";
import { getXmtpClient } from "../../utils/xmtpRN/sync";

export async function initXmtpClient(args: {
  signer: Signer;
  address: string;
  privyAccountId?: string;
  isEphemeral?: boolean;
  pkPath?: string;
}) {
  const { signer, address, ...restArgs } = args;

  if (!signer || !address) {
    throw new Error("No signer or address");
  }

  try {
    const base64Key = await createXmtpClientFromSigner(signer, async () => {
      await awaitableAlert(
        translate("current_installation_revoked"),
        translate("current_installation_revoked_description")
      );
      throw new Error("Current installation revoked");
    });

    if (!base64Key) return;

    await connectWithBase64Key({
      address,
      base64Key,
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
  base64Key: string;
};

type IPrivyArgs = IBaseArgs & {
  privyAccountId: string;
};

type IEphemeralArgs = IBaseArgs & {
  isEphemeral: true;
};

type IPrivateKeyArgs = IBaseArgs & {
  pkPath: string;
};

type IStandardArgs = IBaseArgs;

type IConnectWithBase64KeyArgs =
  | IPrivyArgs
  | IEphemeralArgs
  | IPrivateKeyArgs
  | IStandardArgs;

export async function connectWithBase64Key(args: IConnectWithBase64KeyArgs) {
  const { address, base64Key } = args;

  logger.debug("In connectWithBase64Key");

  if (!address) {
    sentryTrackMessage("Could not connect because no address");
    return;
  }

  try {
    await performLogoutAndSaveKey(address, base64Key);

    useAccountsStore.getState().setCurrentAccount(address, true);

    await initializeDatabase(address);
    await finalizeAccountSetup(args);
    sentryTrackMessage("Connecting done!");
  } catch (e) {
    logger.error(e, { context: "Onboarding - connectWithBase64Key" });
    Alert.alert(translate("onboarding_error"));
    throw e;
  }
}

async function performLogoutAndSaveKey(address: string, base64Key: string) {
  logger.debug("Waiting for logout tasks");
  await waitForLogoutTasksDone(500);
  logger.debug("Logout tasks done, saving xmtp key");
  await saveXmtpKey(address, base64Key);
  logger.debug("XMTP Key saved");
}

async function initializeDatabase(address: string) {
  logger.debug("Initiating converse db");
  await initDb(address);
  logger.debug("Refreshing profiles");
  await refreshProfileForAddress(address, address);
}

async function finalizeAccountSetup(args: IConnectWithBase64KeyArgs) {
  logger.debug("Finalizing account setup");

  const { address } = args;

  useAccountsStore.getState().setCurrentAccount(address, false);

  getSettingsStore(address)
    .getState()
    .setEphemeralAccount("isEphemeral" in args && args.isEphemeral);

  if ("pkPath" in args) {
    getWalletStore(address).getState().setPrivateKeyPath(args.pkPath);
  }

  getXmtpClient(address);

  logger.debug("Account setup finalized");
}

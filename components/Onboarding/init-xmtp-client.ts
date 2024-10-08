import { Signer } from "ethers";
import { Alert } from "react-native";

import { initDb } from "../../data/db";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  getSettingsStore,
  getWalletStore,
  useAccountsStore,
} from "../../data/store/accountsStore";
import {
  ConnectionMethod,
  useOnboardingStore,
} from "../../data/store/onboardingStore";
import { translate } from "../../i18n";
import { awaitableAlert } from "../../utils/alert";
import { saveXmtpKey } from "../../utils/keychain/helpers";
import logger from "../../utils/logger";
import { logoutAccount, waitForLogoutTasksDone } from "../../utils/logout";
import { sentryTrackMessage } from "../../utils/sentry";
import { getXmtpBase64KeyFromSigner } from "../../utils/xmtpRN/signIn";
import { getXmtpClient } from "../../utils/xmtpRN/sync";

export async function initXmtpClient(args: {
  signer: Signer;
  address: string;
  connectionMethod: ConnectionMethod;
  privyAccountId: string;
  isEphemeral: boolean;
  pkPath: string;
}) {
  const {
    signer,
    address,
    connectionMethod,
    privyAccountId,
    isEphemeral,
    pkPath,
  } = args;
  if (!signer || !address) {
    throw new Error("No signer or address");
  }
  try {
    const base64Key = await getXmtpBase64KeyFromSigner(signer, async () => {
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
      connectionMethod,
      privyAccountId,
      isEphemeral,
      pkPath,
    });
  } catch (e) {
    logoutAccount(
      await signer.getAddress(),
      false,
      true,
      () => {},
      () => {}
    );
    logger.error(e);
    throw e;
  }
}

export async function connectWithBase64Key(args: {
  address: string;
  base64Key: string;
  connectionMethod: ConnectionMethod;
  privyAccountId: string;
  isEphemeral: boolean;
  pkPath: string;
}) {
  const {
    address,
    base64Key,
    connectionMethod,
    privyAccountId,
    isEphemeral,
    pkPath,
  } = args;
  logger.debug("In connectWithBase64Key");
  if (!address) {
    sentryTrackMessage("Could not connect because no address");
    return;
  }
  logger.debug("Waiting for logout tasks");
  await waitForLogoutTasksDone(500);
  logger.debug("Logout tasks done, saving xmtp key");
  await saveXmtpKey(address, base64Key);
  logger.debug("XMTP Key saved");
  // Successfull login for user, let's setup the storage !
  useAccountsStore.getState().setCurrentAccount(address, true);
  try {
    if (connectionMethod === "phone" && privyAccountId) {
      useAccountsStore.getState().setPrivyAccountId(address, privyAccountId);
    }
    logger.debug("Initiating converse db");
    await initDb(address);
    logger.debug("Refreshing profiles");
    await refreshProfileForAddress(address, address);
    // Now we can really set!
    useAccountsStore.getState().setCurrentAccount(address, false);
    getSettingsStore(address).getState().setOnboardedAfterProfilesRelease(true);
    if (isEphemeral) {
      getSettingsStore(address).getState().setEphemeralAccount(true);
    } else {
      getSettingsStore(address).getState().setEphemeralAccount(false);
    }
    if (pkPath) {
      getWalletStore(address).getState().setPrivateKeyPath(pkPath);
    }
    useOnboardingStore.getState().setAddingNewAccount(false);
    // Now we can instantiate the XMTP Client
    getXmtpClient(address);
    sentryTrackMessage("Connecting done!");
  } catch (e) {
    // Cleanup
    logger.error(e, { context: "Onboarding - connectWithBase64Key" });
    Alert.alert(translate("onboarding_error"));
    throw e;
  }
}

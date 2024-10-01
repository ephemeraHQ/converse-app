import ConnectViaWallet from "@components/Onboarding/ConnectViaWallet";
import Screen from "@components/Screen";
import { initDb } from "@data/db";
import { refreshProfileForAddress } from "@data/helpers/profiles/profilesUpdate";
import {
  getSettingsStore,
  getWalletStore,
  useAccountsStore,
} from "@data/store/accountsStore";
import { useOnboardingStore } from "@data/store/onboardingStore";
import { useSelect } from "@data/store/storeHelpers";
import { saveXmtpKey } from "@utils/keychain/helpers";
import logger from "@utils/logger";
import { waitForLogoutTasksDone } from "@utils/logout";
import { sentryTrackMessage } from "@utils/sentry";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { translate } from "i18n-js";
import { useCallback } from "react";
import { Alert } from "react-native";

export function ConnectWalletScreen() {
  const { connectionMethod, address, isEphemeral, pkPath, privyAccountId } =
    useOnboardingStore(
      useSelect([
        "connectionMethod",
        "desktopConnectSessionId",
        "address",
        "signer",
        "setLoading",
        "isEphemeral",
        "pkPath",
        "privyAccountId",
        "resetOnboarding",
      ])
    );

  const connectWithBase64Key = useCallback(
    async (base64Key: string, onError: () => void) => {
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
      // Successfull login for user, let's setup
      // the storage !
      useAccountsStore.getState().setCurrentAccount(address, true);
      try {
        if (connectionMethod === "phone" && privyAccountId) {
          useAccountsStore
            .getState()
            .setPrivyAccountId(address, privyAccountId);
        }
        logger.debug("Initiating converse db");
        await initDb(address);
        logger.debug("Refreshing profiles");
        await refreshProfileForAddress(address, address);
        // Now we can really set!
        useAccountsStore.getState().setCurrentAccount(address, false);
        getSettingsStore(address)
          .getState()
          .setOnboardedAfterProfilesRelease(true);

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
        logger.error(e, { context: "Onboarding - connectWithBase64Key" });
        // Cleanup
        Alert.alert(translate("onboarding_error"));
        onError();
      }
    },
    [address, connectionMethod, isEphemeral, pkPath, privyAccountId]
  );

  return (
    <Screen>
      <ConnectViaWallet connectWithBase64Key={connectWithBase64Key} />
    </Screen>
  );
}

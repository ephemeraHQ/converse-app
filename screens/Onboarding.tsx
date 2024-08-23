import { translate } from "@i18n/index";
import { awaitableAlert } from "@utils/alert";
import logger from "@utils/logger";
import { sentryAddBreadcrumb, sentryTrackMessage } from "@utils/sentry";
import { useCallback, useEffect, useRef } from "react";

import ConnectViaWallet from "../components/Onboarding/ConnectViaWallet";
import DesktopConnect from "../components/Onboarding/DesktopConnect";
import DesktopConnectFlow from "../components/Onboarding/DesktopConnectFlow";
import PrivyConnect from "../components/Onboarding/PrivyConnect";
import SeedPhraseConnect from "../components/Onboarding/SeedPhraseConnect";
import WalletSelector from "../components/Onboarding/WalletSelector";
import { initDb } from "../data/db";
import { refreshProfileForAddress } from "../data/helpers/profiles/profilesUpdate";
import {
  getSettingsStore,
  getWalletStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import { useSelect } from "../data/store/storeHelpers";
import { saveXmtpKey } from "../utils/keychain/helpers";
import { waitForLogoutTasksDone } from "../utils/logout";
import { getXmtpBase64KeyFromSigner } from "../utils/xmtpRN/signIn";
import { getXmtpClient } from "../utils/xmtpRN/sync";

export default function Onboarding() {
  const {
    connectionMethod,
    desktopConnectSessionId,
    address,
    signer,
    setLoading,
    isEphemeral,
    pkPath,
    privyAccountId,
    resetOnboarding,
  } = useOnboardingStore(
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

  const initiatingClientFor = useRef<string | undefined>(undefined);

  const connectWithBase64Key = useCallback(
    async (base64Key: string) => {
      sentryAddBreadcrumb("In connectWithBase64Key");
      if (!address) {
        sentryTrackMessage("Could not connect because no address");
        return;
      }
      sentryAddBreadcrumb("Waiting for logout tasks");
      await waitForLogoutTasksDone(500);
      sentryAddBreadcrumb("Logout tasks done, saving xmtp key");
      await saveXmtpKey(address, base64Key);
      sentryAddBreadcrumb("XMTP Key saved");
      // Successfull login for user, let's setup
      // the storage !
      useAccountsStore.getState().setCurrentAccount(address, true);
      if (connectionMethod === "phone" && privyAccountId) {
        useAccountsStore.getState().setPrivyAccountId(address, privyAccountId);
      }
      sentryAddBreadcrumb("Initiating converse db");
      await initDb(address);
      sentryAddBreadcrumb("Refreshing profiles");
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
    },
    [address, connectionMethod, isEphemeral, pkPath, privyAccountId]
  );

  // Method used for all signers that can sign directly
  // (seedphrase / privy)
  const initXmtpClient = useCallback(async () => {
    if (!signer || !address || initiatingClientFor.current === address) {
      return;
    }
    initiatingClientFor.current = address;

    try {
      const base64Key = await getXmtpBase64KeyFromSigner(signer, async () => {
        await awaitableAlert(
          translate("current_installation_revoked"),
          translate("current_installation_revoked_description")
        );
        resetOnboarding();
      });
      if (!base64Key) return;
      await connectWithBase64Key(base64Key);
    } catch (e) {
      initiatingClientFor.current = undefined;
      setLoading(false);
      logger.error(e);
    }
  }, [address, connectWithBase64Key, resetOnboarding, setLoading, signer]);

  useEffect(() => {
    if (signer && connectionMethod !== "wallet") {
      // We can trigger xmtp client right now
      initXmtpClient();
    }
  }, [connectionMethod, initXmtpClient, signer]);

  if (desktopConnectSessionId) {
    return <DesktopConnectFlow />;
  } else if (connectionMethod === "wallet") {
    return <ConnectViaWallet connectWithBase64Key={connectWithBase64Key} />;
  } else if (connectionMethod === "desktop") {
    return <DesktopConnect />;
  } else if (connectionMethod === "seedPhrase") {
    return <SeedPhraseConnect />;
  } else if (connectionMethod === "phone") {
    return <PrivyConnect />;
  }

  return <WalletSelector />;
}

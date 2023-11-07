import { useCallback, useEffect, useRef } from "react";

import ConnectViaWallet from "../components/Onboarding/ConnectViaWallet";
import DesktopConnect from "../components/Onboarding/DesktopConnect";
import DesktopConnectFlow from "../components/Onboarding/DesktopConnectFlow";
import PrivyConnect from "../components/Onboarding/PrivyConnect";
import SeedPhraseConnect from "../components/Onboarding/SeedPhraseConnect";
import WalletSelector from "../components/Onboarding/WalletSelector";
import { initDb } from "../data/db";
import {
  getSettingsStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import { saveXmtpKey } from "../utils/keychain";
import { waitForLogoutTasksDone } from "../utils/logout";
import { pick } from "../utils/objects";
import { getXmtpKeysFromSigner } from "../utils/xmtpJS/client";
import { getXmtpClient } from "../utils/xmtpRN/client";

export default function Onboarding() {
  const {
    connectionMethod,
    desktopConnectSessionId,
    address,
    signer,
    setLoading,
    isEphemeral,
    privyAccountId,
  } = useOnboardingStore((s) =>
    pick(s, [
      "connectionMethod",
      "desktopConnectSessionId",
      "address",
      "signer",
      "setLoading",
      "isEphemeral",
      "privyAccountId",
    ])
  );

  const initiatingClientFor = useRef<string | undefined>(undefined);

  const connectWithBase64Key = useCallback(
    async (base64Key: string) => {
      if (!address) return;
      await waitForLogoutTasksDone(500);
      await saveXmtpKey(address, base64Key);
      // Successfull login for user, let's setup
      // the storage !
      useAccountsStore.getState().setCurrentAccount(address, true);
      if (connectionMethod === "phone" && privyAccountId) {
        useAccountsStore.getState().setPrivyAccountId(address, privyAccountId);
      }
      await initDb(address);

      if (isEphemeral) {
        getSettingsStore(address).getState().setEphemeralAccount(true);
      } else {
        getSettingsStore(address).getState().setEphemeralAccount(false);
      }
      useOnboardingStore.getState().setAddingNewAccount(false);
      // Now we can instantiate the XMTP Client
      getXmtpClient(address);
    },
    [address, connectionMethod, isEphemeral, privyAccountId]
  );

  // Method used for all signers that can sign directly
  // (seedphrase / privy)
  const initXmtpClient = useCallback(async () => {
    if (!signer || !address || initiatingClientFor.current === address) {
      return;
    }
    initiatingClientFor.current = address;

    try {
      const keysBuffer = await getXmtpKeysFromSigner(signer);
      const base64Key = keysBuffer.toString("base64");
      await connectWithBase64Key(base64Key);
    } catch (e) {
      initiatingClientFor.current = undefined;
      setLoading(false);
      console.error(e);
    }
  }, [address, connectWithBase64Key, setLoading, signer]);

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

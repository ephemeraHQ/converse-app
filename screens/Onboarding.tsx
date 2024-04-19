import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

import InviteCode from "../components/Onboarding/InviteCode";
import PrivyConnect from "../components/Onboarding/PrivyConnect";
import UserProfile from "../components/Onboarding/UserProfile";
import WalletSelector from "../components/Onboarding/WalletSelector";
import { initDb } from "../data/db";
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
    address,
    signer,
    setLoading,
    isEphemeral,
    pkPath,
    privyAccountId,
    step,
  } = useOnboardingStore(
    useSelect([
      "connectionMethod",
      "address",
      "signer",
      "setLoading",
      "isEphemeral",
      "pkPath",
      "privyAccountId",
      "step",
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
      if (pkPath) {
        getWalletStore(address).getState().setPrivateKeyPath(pkPath);
      }
      useOnboardingStore.getState().setAddingNewAccount(false);
      // Now we can instantiate the XMTP Client
      getXmtpClient(address);
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
      const base64Key = await getXmtpBase64KeyFromSigner(signer);
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

  if (step === "login" && connectionMethod === "phone") {
    if (Platform.OS === "web") {
      // Returning both UIs on web because PrivyConnect is just a modal
      return (
        <>
          <WalletSelector />
          <PrivyConnect />
        </>
      );
    } else {
      return <PrivyConnect />;
    }
  } else if (step === "invite") {
    return <InviteCode />;
  } else if (step === "profile") {
    return <UserProfile />;
  }

  return <WalletSelector />;
}

import { useWeb3ModalProvider } from "@web3modal/ethers5/react";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";

import config from "../config";
import {
  getSettingsStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import { saveXmtpKey } from "../utils/keychain/helpers";
import { getXmtpClient } from "../utils/xmtpRN/sync";

export default function Onboarding() {
  const { walletProvider } = useWeb3ModalProvider();
  const connectingToXmtp = useRef(false);
  useEffect(() => {
    const connectToXmtp = async () => {
      if (walletProvider && !connectingToXmtp.current) {
        try {
          const provider = new ethers.providers.Web3Provider(walletProvider);
          const signer = provider.getSigner();
          const keys = await Client.getKeys(signer, {
            env: config.xmtpEnv,
            // we don't need to publish the contact here since it
            // will happen when we create the client later
            skipContactPublishing: true,
            // we can skip persistence on the keystore for this short-lived
            // instance
            persistConversations: false,
          });
          const base64Key = Buffer.from(keys).toString("base64");
          const address = await signer.getAddress();
          await saveXmtpKey(address, base64Key);
          // Successfull login for user, let's setup
          // the storage !
          useAccountsStore.getState().setCurrentAccount(address, true);
          // if (connectionMethod === "phone" && privyAccountId) {
          //   useAccountsStore.getState().setPrivyAccountId(address, privyAccountId);
          // }

          const isEphemeral = false;

          if (isEphemeral) {
            getSettingsStore(address).getState().setEphemeralAccount(true);
          } else {
            getSettingsStore(address).getState().setEphemeralAccount(false);
          }

          useOnboardingStore.getState().setAddingNewAccount(false);
          // Now we can instantiate the XMTP Client
          getXmtpClient(address);
        } catch (e) {
          console.error(e);
        }
        connectingToXmtp.current = false;
      }
    };
    connectToXmtp();
  }, [walletProvider]);

  return (
    <View>
      <Text>HEYYYY</Text>
      <w3m-button />
    </View>
  );
}

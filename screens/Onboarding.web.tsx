import { ConnectedWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useWeb3ModalProvider, useWeb3Modal } from "@web3modal/ethers5/react";
import { ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import { Text, View, useColorScheme, StyleSheet } from "react-native";

import Picto from "../components/Picto/Picto";
import TableView from "../components/TableView/TableView";
import {
  TableViewEmoji,
  TableViewPicto,
} from "../components/TableView/TableViewImage";
import config from "../config";
import {
  getSettingsStore,
  useAccountsStore,
  useHasOnePrivyAccount,
} from "../data/store/accountsStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { saveXmtpKey } from "../utils/keychain/helpers";
import { getXmtpBase64KeyFromSigner } from "../utils/xmtpRN/client";
import { getXmtpClient } from "../utils/xmtpRN/sync";

export default function Onboarding() {
  const styles = useStyles();
  const { walletProvider } = useWeb3ModalProvider();
  const { open: openModal } = useWeb3Modal();
  const hasOnePrivy = useHasOnePrivyAccount();
  const connectingToXmtp = useRef(false);
  const {
    login: loginWithPrivy,
    ready,
    logout: logoutFromPrivy,
    user: privyUser,
  } = usePrivy();
  const { wallets } = useWallets();
  const privyEmbeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );
  const [connectionMethod, setConnectionMethod] = useState<
    undefined | "phone" | "wallet"
  >(undefined);

  useEffect(() => {
    logoutFromPrivy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const connectToXmtp = async () => {
      if (
        (connectionMethod === "wallet" && walletProvider) ||
        (connectionMethod === "phone" &&
          privyEmbeddedWallet &&
          privyUser &&
          !connectingToXmtp.current)
      ) {
        connectingToXmtp.current = true;
        try {
          const provider = walletProvider
            ? new ethers.providers.Web3Provider(walletProvider)
            : await (
                privyEmbeddedWallet as ConnectedWallet
              ).getEthersProvider();
          if (privyEmbeddedWallet) {
            await privyEmbeddedWallet.switchChain(
              config.evm.transactionChainId as `0x${string}`
            );
          }

          const signer = provider.getSigner();

          const address = await signer.getAddress();
          const base64Key = await getXmtpBase64KeyFromSigner(signer);
          await saveXmtpKey(address, base64Key);
          // Successfull login for user, let's setup
          // the storage !
          useAccountsStore.getState().setCurrentAccount(address, true);
          if (connectionMethod === "phone" && privyUser?.id) {
            useAccountsStore
              .getState()
              .setPrivyAccountId(address, privyUser.id);
          }

          // TODO => enable ephemeral on web?
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
  }, [connectionMethod, privyEmbeddedWallet, privyUser, walletProvider]);

  const colorScheme = useColorScheme();

  if (!ready) {
    // Do nothing while the PrivyProvider initializes with updated user state
    return <></>;
  }

  const rightView = (
    <TableViewPicto
      symbol="chevron.right"
      color={textSecondaryColor(colorScheme)}
    />
  );
  return (
    <View style={styles.container}>
      <Picto picto="message.circle.fill" size={80} style={[styles.picto]} />

      <Text style={styles.title}>GM</Text>
      <Text style={styles.p}>
        Converse lets you communicate and transact freely and safely.
      </Text>
      <TableView
        title="CONNECT TO CONVERSE"
        items={[
          {
            id: "phone",
            leftView: <TableViewEmoji emoji="📞" />,
            title: "Connect via Phone",
            rightView,
            action: () => {
              setConnectionMethod("phone");
              loginWithPrivy();
            },
          },
          {
            id: "wallet",
            leftView: <TableViewEmoji emoji="🔑" />,
            title: "Connect via Wallet",
            rightView,
            action: () => {
              setConnectionMethod("wallet");
              openModal();
            },
          },
        ].filter((i) => i.id !== "phone" || !hasOnePrivy)}
      />
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: backgroundColor(colorScheme),
      flex: 1,
    },
    picto: {
      marginTop: 50,
      marginBottom: 61,
    },
    title: {
      textAlign: "center",
      fontSize: 24,
      color: textPrimaryColor(colorScheme),
    },
    p: {
      textAlign: "center",
      marginTop: 21,
      marginLeft: 32,
      marginRight: 32,
      marginBottom: 80,
      fontSize: 14,
      lineHeight: 20,
      color: textSecondaryColor(colorScheme),
      maxWidth: 260,
    },
  });
};

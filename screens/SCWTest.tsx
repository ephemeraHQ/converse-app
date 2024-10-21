import { thirdwebClient } from "@utils/thirdweb";
import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { prepareTransaction } from "thirdweb";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { base } from "thirdweb/chains";
import {
  useActiveAccount,
  useConnect,
  useSendTransaction,
  useSetActiveWallet,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

import config from "../config";

const MainScreen: React.FC = () => {
  const { connect: thirdwebConnect } = useConnect();
  const activeAccount = useActiveAccount();
  const sendTransaction = useSendTransaction();
  const setActiveWallet = useSetActiveWallet();
  const switchChain = useSwitchActiveWalletChain();

  const handleButtonPress = useCallback(() => {
    thirdwebConnect(async () => {
      // instantiate wallet
      const coinbaseWallet = createWallet("com.coinbase.wallet", {
        appMetadata: config.walletConnectConfig.appMetadata,
        mobileConfig: {
          callbackURL: `converse-dev://mobile-wallet-protocol`,
        },
        walletConfig: {
          options: "smartWalletOnly",
        },
      });
      try {
        console.log("connecting");
        await coinbaseWallet.connect({ client: thirdwebClient });
        console.log("connected");
        setActiveWallet(coinbaseWallet);
      } catch (e) {
        console.log(e);
      }
      return coinbaseWallet;
    });
  }, [thirdwebConnect, setActiveWallet]);

  const handleTransaction = useCallback(async () => {
    console.log("clicked!");
    const transaction = prepareTransaction({
      to: "0x2376e9C7C604D1827bA9aCb1293Dc8b4DA2f0DB3",
      value: BigInt(10000000000000),
      chain: base,
      client: thirdwebClient,
    });
    console.log("transaction", transaction);
    try {
      await switchChain(base);
      console.log("switched chain");
      const tx = await sendTransaction.mutateAsync(transaction);
      console.log("sent transaction", tx.transactionHash);
    } catch (e: any) {
      alert(e.message);
      console.log(e);
    }
  }, [switchChain, sendTransaction]);

  const handleSignature = useCallback(async () => {
    if (!activeAccount) return;
    await switchChain(base);
    const signer = await ethers5Adapter.signer.toEthers({
      client: thirdwebClient,
      chain: base,
      account: activeAccount,
    });
    const signature = await signer.signMessage("Hello, world");
    console.log("base", signature);
  }, [activeAccount, switchChain]);

  return (
    <View style={styles.container}>
      {!activeAccount && (
        <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
          <Text style={styles.buttonText}>Connect to wallet</Text>
        </TouchableOpacity>
      )}
      {activeAccount && (
        <>
          <Text>Address: {activeAccount.address}</Text>
          <TouchableOpacity style={styles.button} onPress={handleTransaction}>
            <Text style={styles.buttonText}>Trigger tx!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleSignature}>
            <Text style={styles.buttonText}>Trigger signature</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MainScreen;

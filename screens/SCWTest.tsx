import { thirdwebClient } from "@utils/thirdweb";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Button } from "react-native";
import { prepareTransaction } from "thirdweb";
import { sepolia } from "thirdweb/chains";
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
  const handleButtonPress = () => {
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
  };
  const handleTransaction = async () => {
    const transaction = prepareTransaction({
      to: "0x2376e9C7C604D1827bA9aCb1293Dc8b4DA2f0DB3",
      value: BigInt(1),
      chain: sepolia,
      client: thirdwebClient,
    });
    console.log("transaction", transaction);
    try {
      await switchChain(sepolia);
      console.log("switched chain");
      // await sendTransaction.mutateAsync(transaction);
      // console.log("sent transaction");
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
        {!activeAccount && (
          <Text style={styles.buttonText}>Connect to wallet</Text>
        )}
        {activeAccount && (
          <Button onPress={handleTransaction} title="TRIGGER TX" />
        )}
      </TouchableOpacity>
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

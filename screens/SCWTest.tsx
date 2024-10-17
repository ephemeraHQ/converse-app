import { thirdwebClient } from "@utils/thirdweb";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useConnect, useSetActiveWallet } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

import config from "../config";

const MainScreen: React.FC = () => {
  const { connect: thirdwebConnect } = useConnect();
  const setActiveWallet = useSetActiveWallet();
  const handleButtonPress = () => {
    thirdwebConnect(async () => {
      // instantiate wallet
      const coinbaseWallet = createWallet("com.coinbase.wallet", {
        appMetadata: config.walletConnectConfig.appMetadata,
        mobileConfig: {
          callbackURL: `https://${config.websiteDomain}/coinbase`,
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
        <Text style={styles.buttonText}>Connect to wallet</Text>
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

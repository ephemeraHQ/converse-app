import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  textInputStyle,
  textSecondaryColor,
} from "@styles/colors";
import logger from "@utils/logger";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Platform,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { v4 as uuidv4 } from "uuid";

import { NavigationParamList } from "./Navigation/Navigation";
import AndroidBackAction from "../components/AndroidBackAction";
import OnboardingComponent from "../components/Onboarding/OnboardingComponent";
import { getSignerFromPrivateKey } from "../components/Onboarding/PrivateKeyConnect";
import { useCurrentAccount, useWalletStore } from "../data/store/accountsStore";
import { converseEventEmitter } from "../utils/events";
import { savePrivateKey } from "../utils/keychain/helpers";
import { shortAddress } from "../utils/str";

export default function EnableTransactionsScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "EnableTransactions">) {
  const colorScheme = useColorScheme();
  const [privateKey, setPrivateKey] = useState("");
  const currentAccount = useCurrentAccount();
  const textInputRef = useRef<TextInput | null>(null);
  const [loading, setLoading] = useState(false);
  const setPkPath = useWalletStore((s) => s.setPrivateKeyPath);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        Platform.OS === "ios" ? (
          <Button
            title="Cancel"
            onPress={() => {
              navigation.goBack();
            }}
          />
        ) : (
          <AndroidBackAction navigation={navigation} />
        ),
    });
  }, [navigation]);
  const styles = useStyles();
  const handlePrivateKey = useCallback(async () => {
    if (privateKey || privateKey.trim().length === 0) return;
    setLoading(true);
    setTimeout(async () => {
      try {
        const signer = await getSignerFromPrivateKey(privateKey.trim());
        if (!signer) {
          setLoading(false);
          return;
        }
        if (signer.address !== currentAccount) {
          Alert.alert(
            "Wrong key",
            `This private key / seed phrase does not match your current wallet (${shortAddress(
              currentAccount || ""
            )})`
          );
          setLoading(false);
          return;
        }
        // Now we can save this key and setup its path
        const pkPath = `PK-${uuidv4()}`;
        try {
          await savePrivateKey(pkPath, signer.privateKey);
          setPkPath(pkPath);
          setLoading(false);
          navigation.goBack();
          converseEventEmitter.emit("enable-transaction-mode", true);
        } catch (e: any) {
          Alert.alert("An error occured", e.toString());
          setLoading(false);
        }
      } catch (e) {
        logger.warn(e);
      }
      setLoading(false);
    }, 10);
  }, [currentAccount, navigation, privateKey, setPkPath]);

  return (
    <View style={styles.enableTransactionsContainer}>
      <OnboardingComponent
        title="Enable transactions"
        subtitle={`Please enter your seed phrase or private key below to enable transactions from Converse. It will be stored locally in the ${
          Platform.OS === "ios"
            ? "secure enclave of your phone"
            : "Android Keystore system"
        }.`}
        picto="key.horizontal"
        primaryButtonText="Connect"
        primaryButtonAction={handlePrivateKey}
        backButtonText="Cancel"
        backButtonAction={() => {
          navigation.goBack();
        }}
        inModal
        shrinkWithKeyboard
        isLoading={loading}
      >
        <View style={styles.enableTransactionsContent}>
          <TextInput
            multiline
            textAlignVertical="top"
            style={[
              textInputStyle(colorScheme),
              { width: "100%", height: "100%" },
            ]}
            placeholder="Enter your seed phrase or private key"
            placeholderTextColor={textSecondaryColor(colorScheme)}
            onChangeText={(content) => {
              setPrivateKey(content.replace(/\n/g, " "));
            }}
            onFocus={() => {
              setPrivateKey(privateKey.trim());
            }}
            value={privateKey}
            ref={(r) => {
              textInputRef.current = r;
            }}
            onKeyPress={(e) => {
              if (e.nativeEvent.key === "Enter") {
                textInputRef.current?.blur();
              }
            }}
          />
        </View>
      </OnboardingComponent>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    enableTransactionsContainer: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    enableTransactionsContent: {
      width: "100%",
      paddingRight: 25,
      paddingLeft: 25,
      height: 130,
      marginTop: 38,
    },
  });
};

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Button,
  StyleSheet,
  useColorScheme,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import uuid from "react-native-uuid";

import AndroidBackAction from "../components/AndroidBackAction";
import OnboardingComponent from "../components/Onboarding/OnboardingComponent";
import { getSignerFromSeedPhraseOrPrivateKey } from "../components/Onboarding/SeedPhraseConnect";
import { useCurrentAccount, useWalletStore } from "../data/store/accountsStore";
import {
  textSecondaryColor,
  textInputStyle,
  backgroundColor,
} from "../utils/colors";
import { converseEventEmitter } from "../utils/events";
import { setSecureItemAsync } from "../utils/keychain";
import { shortAddress } from "../utils/str";
import { NavigationParamList } from "./Navigation/Navigation";

export default function EnableTransactionsScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "EnableTransactions">) {
  const colorScheme = useColorScheme();
  const [seedPhrase, setSeedPhrase] = useState("");
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
  const handleSeedPhrase = useCallback(async () => {
    if (!seedPhrase || seedPhrase.trim().length === 0) return;
    setLoading(true);
    setTimeout(async () => {
      try {
        const seedPhraseSigner = await getSignerFromSeedPhraseOrPrivateKey(
          seedPhrase.trim()
        );
        if (!seedPhraseSigner) {
          setLoading(false);
          return;
        }
        if (seedPhraseSigner.address !== currentAccount) {
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
        const pkPath = `PK-${uuid.v4().toString()}`;
        try {
          await setSecureItemAsync(pkPath, seedPhraseSigner.privateKey);
          setPkPath(pkPath);
          setLoading(false);
          navigation.goBack();
          converseEventEmitter.emit("enable-transaction-mode", true);
        } catch (e: any) {
          Alert.alert("An error occured", e.toString());
          setLoading(false);
        }
      } catch (e) {
        console.log(e);
      }
      setLoading(false);
    }, 10);
  }, [currentAccount, navigation, seedPhrase, setPkPath]);

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
        primaryButtonAction={handleSeedPhrase}
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
              setSeedPhrase(content.replace(/\n/g, " "));
            }}
            onFocus={() => {
              setSeedPhrase(seedPhrase.trim());
            }}
            value={seedPhrase}
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

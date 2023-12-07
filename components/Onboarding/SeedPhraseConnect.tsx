import { utils } from "@noble/secp256k1";
import { Wallet } from "ethers";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  useColorScheme,
  StyleSheet,
  Text,
  Platform,
  Alert,
} from "react-native";
import { AvoidSoftInput } from "react-native-avoid-softinput";

import { useOnboardingStore } from "../../data/store/onboardingStore";
import {
  textInputStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getPrivateKeyFromMnemonic, validateMnemonic } from "../../utils/eth";
import { pick } from "../../utils/objects";
import OnboardingComponent from "./OnboardingComponent";

export const getSignerFromSeedPhraseOrPrivateKey = async (
  seedPhraseOrPrivateKey: string
) => {
  try {
    const signer = new Wallet(seedPhraseOrPrivateKey);
    return signer;
  } catch (e: any) {
    console.log(
      "Could not instantitate directly from private key, trying to decode seed phrase"
    );
  }
  let rightMnemonic = seedPhraseOrPrivateKey;
  try {
    rightMnemonic = validateMnemonic(seedPhraseOrPrivateKey);
  } catch (e) {
    console.log(e);
    Alert.alert("This private key / seed phrase is invalid. Please try again");
    return;
  }
  try {
    const privateKey = await getPrivateKeyFromMnemonic(rightMnemonic);
    const signer = new Wallet(privateKey);
    return signer;
  } catch (e) {
    console.log(e);
    Alert.alert("This private key / seed phrase is invalid. Please try again");
  }
};

export default function SeedPhraseConnect() {
  const {
    setLoading,
    setConnectionMethod,
    setSigner,
    setIsEphemeral,
    setPkPath,
  } = useOnboardingStore((s) =>
    pick(s, [
      "setLoading",
      "setConnectionMethod",
      "setSigner",
      "setIsEphemeral",
      "setPkPath",
    ])
  );
  const [seedPhrase, setSeedPhrase] = useState("");
  const colorScheme = useColorScheme();
  const textInputRef = useRef<TextInput | null>(null);
  const styles = useStyles();

  const generateWallet = useCallback(async () => {
    setLoading(true);
    const signer = new Wallet(utils.randomPrivateKey());
    setIsEphemeral(true);
    setSigner(signer);
  }, [setIsEphemeral, setLoading, setSigner]);

  useEffect(() => {
    return () => {
      setIsEphemeral(false);
    };
  }, [setIsEphemeral]);

  const loginWithSeedPhrase = useCallback(
    async (mnemonic: string) => {
      setLoading(true);
      setTimeout(async () => {
        const seedPhraseSigner = await getSignerFromSeedPhraseOrPrivateKey(
          mnemonic
        );
        if (!seedPhraseSigner) {
          setLoading(false);
          return;
        }
        setSigner(seedPhraseSigner);
        // Let's save
        // const pkPath = `PK-${uuid.v4().toString()}`;
        // try {
        //   await savePrivateKey(pkPath, seedPhraseSigner.privateKey);
        //   setPkPath(pkPath);
        //   setSigner(seedPhraseSigner);
        // } catch (e: any) {
        //   // No biometrics?
        //   Alert.alert("An error occured", e.toString());
        //   setLoading(false);
        // }
      }, 10);
    },
    [setLoading, setSigner]
  );

  const avoidInputEffect = useCallback(() => {
    AvoidSoftInput.setHideAnimationDelay(0);
    AvoidSoftInput.setShowAnimationDelay(0);

    // This should be run when screen gains focus - enable the module where it's needed
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    AvoidSoftInput.setEnabled(true);
    return () => {
      // This should be run when screen loses focus - disable the module where it's not needed, to make a cleanup
      AvoidSoftInput.setEnabled(false);
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, []);

  useEffect(avoidInputEffect);

  return (
    <OnboardingComponent
      title="Connect via key"
      subtitle={`Please enter your wallet’s seed phrase or private key. It will be stored locally in the ${
        Platform.OS === "ios"
          ? "secure enclave of your phone"
          : "Android Keystore system"
      }.`}
      picto="key.horizontal"
      primaryButtonText="Connect"
      primaryButtonAction={() => {
        if (!seedPhrase || seedPhrase.trim().length === 0) return;
        loginWithSeedPhrase(seedPhrase.trim());
      }}
      backButtonText="Back to home screen"
      backButtonAction={() => {
        setConnectionMethod(undefined);
      }}
    >
      <View style={styles.seedPhraseContainer}>
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
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.links}>
          By signing in you agree to our{" "}
          <Text
            style={styles.link}
            onPress={() =>
              Linking.openURL(
                "https://converseapp.notion.site/Terms-and-conditions-004036ad55044aba888cc83e21b8cbdb"
              )
            }
          >
            terms and conditions.
          </Text>
        </Text>
        {/* <Text style={styles.links}>
          <Text style={styles.link} onPress={generateWallet}>
            Try the app with an ephemeral wallet.
          </Text>
        </Text> */}
      </View>
    </OnboardingComponent>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    seedPhraseContainer: {
      width: "100%",
      paddingRight: 25,
      paddingLeft: 25,
      height: 130,
      marginTop: 38,
    },
    links: {
      textAlign: "center",
      marginLeft: 32,
      marginRight: 32,
      marginTop: 30,
      ...Platform.select({
        default: {
          fontSize: 17,
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: textSecondaryColor(colorScheme),
          maxWidth: 260,
        },
      }),
    },
    link: {
      textDecorationLine: "underline",
    },
  });
};

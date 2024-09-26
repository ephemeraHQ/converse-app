import { translate } from "@i18n";
import {
  primaryColor,
  backgroundColor,
  textSecondaryColor,
  textPrimaryColor,
} from "@styles/colors";
import { Wallet } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { AvoidSoftInput } from "react-native-avoid-softinput";

import OnboardingComponent from "./OnboardingComponent";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";

export const getSignerFromPrivateKey = async (privateKey: string) => {
  try {
    const signer = new Wallet(privateKey);
    return signer;
  } catch (e: any) {
    Alert.alert(translate("privateKeyConnect.invalidPrivateKey"));
  }
};

export default function PrivateKeyConnect() {
  const [privateKey, setPrivateKey] = useState("");
  const colorScheme = useColorScheme();
  const textInputRef = useRef<TextInput | null>(null);
  const styles = useStyles();
  const { setLoading, setConnectionMethod, setSigner } = useOnboardingStore(
    useSelect(["setLoading", "setConnectionMethod", "setSigner"])
  );

  const loginWithPrivateKey = useCallback(
    async (privateKey: string) => {
      setLoading(true);
      setTimeout(async () => {
        const signer = await getSignerFromPrivateKey(privateKey);
        if (!signer) {
          setLoading(false);
          return;
        }
        setSigner(signer);
        // Let's save
        // const pkPath = `PK-${uuidv4()}`;
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
      title={translate("privateKeyConnect.title")}
      subtitle={translate("privateKeyConnect.subtitle", {
        storage: translate(
          `privateKeyConnect.storage.${
            Platform.OS === "ios" ? "ios" : "android"
          }`
        ),
      })}
      picto="key.horizontal"
      primaryButtonText={translate("privateKeyConnect.connectButton")}
      primaryButtonAction={() => {
        if (!privateKey || privateKey.trim().length === 0) return;
        loginWithPrivateKey(privateKey.trim());
      }}
      backButtonText={translate("privateKeyConnect.backButton")}
      backButtonAction={() => {
        setConnectionMethod(undefined);
      }}
      showTerms
    >
      <View style={styles.entryContainer}>
        <TextInput
          multiline
          textAlignVertical="top"
          style={styles.textInput}
          placeholder={translate("privateKeyConnect.privateKeyPlaceholder")}
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
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    entryContainer: {
      width: "100%",
      paddingRight: 25,
      paddingLeft: 25,
      height: 130,
      marginTop: 38,
    },
    textInput: {
      width: "100%",
      height: "100%",
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      borderColor: primaryColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
      color: textPrimaryColor(colorScheme),
    },
  });
};

import { translate } from "@i18n";
import { utils } from "@noble/secp256k1";
import { Wallet } from "ethers";
import { useCallback, useEffect } from "react";
import { Text, StyleSheet, Platform, useColorScheme } from "react-native";

import OnboardingComponent from "./OnboardingComponent";
import ValueProps from "./ValueProps";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { textSecondaryColor } from "../../styles/colors";

export default function CreateEphemeral() {
  const styles = useStyles();
  const { setLoading, setConnectionMethod, setSigner, setIsEphemeral } =
    useOnboardingStore(
      useSelect([
        "setLoading",
        "setConnectionMethod",
        "setSigner",
        "setIsEphemeral",
      ])
    );

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

  return (
    <OnboardingComponent
      title={translate("createEphemeral.title")}
      subtitle={translate("createEphemeral.subtitle")}
      picto="cloud"
      primaryButtonText={translate("createEphemeral.createButton")}
      primaryButtonAction={generateWallet}
      backButtonText={translate("createEphemeral.backButton")}
      backButtonAction={() => {
        setConnectionMethod(undefined);
      }}
    >
      <>
        <ValueProps />
        <Text style={styles.p}>
          {translate("createEphemeral.disconnect_to_remove")}
        </Text>
      </>
    </OnboardingComponent>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    p: {
      textAlign: "center",
      marginLeft: 32,
      marginRight: 32,
      ...Platform.select({
        default: {
          fontSize: 17,
          color: textSecondaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: textSecondaryColor(colorScheme),
          maxWidth: 260,
        },
      }),
    },
  });
};

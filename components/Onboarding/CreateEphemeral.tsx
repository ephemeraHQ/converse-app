import { translate } from "@i18n";
import { utils } from "@noble/secp256k1";
import logger from "@utils/logger";
import { Wallet } from "ethers";
import { useCallback, useEffect } from "react";
import { Text, StyleSheet, Platform, useColorScheme } from "react-native";

import OnboardingComponent from "./OnboardingComponent";
import ValueProps from "./ValueProps";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { textPrimaryColor } from "../../styles/colors";

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
  logger.debug("[CreateEphemeral] Store selectors initialized", {
    hasSetLoading: !!setLoading,
    hasSetConnectionMethod: !!setConnectionMethod,
    hasSetSigner: !!setSigner,
    hasSetIsEphemeral: !!setIsEphemeral,
  });

  /**
   * Generates an ephemeral wallet and sets it as the current signer.
   *
   * This function creates a new random wallet, sets it as ephemeral,
   * and updates the global state with the new signer.
   *
   * @returns {Promise<void>}
   *
   * @example
   * // Usage:
   * await generateWallet();
   * // Side effects:
   * // - Sets loading state to true
   * // - Creates new Wallet instance
   * // - Sets isEphemeral to true
   * // - Sets new signer in global state
   *
   * @example
   * // Error handling:
   * try {
   *   await generateWallet();
   * } catch (error) {
   *   console.error('Failed to generate wallet:', error);
   * }
   */
  const generateWallet = useCallback(async () => {
    logger.debug("[CreateEphemeral] Starting wallet generation");
    setLoading(true);

    try {
      // Generate wallet
      logger.debug("[CreateEphemeral] Generating random private key");
      const privateKey = utils.randomPrivateKey();

      // Create wallet instance
      logger.debug("[CreateEphemeral] Creating wallet instance");
      const signer = new Wallet(privateKey);
      logger.debug("[CreateEphemeral] Wallet created", {
        address: signer.address,
      });

      // Update state
      logger.debug("[CreateEphemeral] Updating application state");
      setIsEphemeral(true);
      setSigner(signer);
      logger.info("[CreateEphemeral] Wallet generation complete");
    } catch (error) {
      logger.error("[CreateEphemeral] Error generating wallet:", error);
    } finally {
      setLoading(false);
      logger.debug("[CreateEphemeral] Generation process complete");
    }
  }, [setIsEphemeral, setLoading, setSigner]);

  useEffect(() => {
    console.log("=== CreateEphemeral Cleanup Effect Mounted ===");

    return () => {
      console.log("Cleanup: Resetting ephemeral state to false");
      setIsEphemeral(false);
      console.log("✓ Ephemeral state reset complete");
    };
  }, [setIsEphemeral]);

  console.log("Rendering CreateEphemeral component");
  logger.debug("[CreateEphemeral] Rendering component");
  return (
    <OnboardingComponent
      title={translate("createEphemeral.title")}
      subtitle={translate("createEphemeral.subtitle")}
      picto="cloud"
      primaryButtonText={translate("createEphemeral.createButton")}
      primaryButtonAction={() => {
        console.log("Primary button clicked - initiating wallet generation");
        generateWallet();
        logger.debug("[CreateEphemeral] Wallet generation initiated");
      }}
      backButtonText={translate("createEphemeral.backButton")}
      backButtonAction={() => {
        console.log("Back button clicked - resetting connection method");
        setConnectionMethod(undefined);
        console.log("✓ Connection method reset to undefined");
      }}
      showTerms
    >
      <ValueProps />
      <Text style={styles.p}>
        {translate("createEphemeral.disconnect_to_remove")}
      </Text>
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
          fontSize: 13,
          lineHeight: 17,
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: textPrimaryColor(colorScheme),
          maxWidth: 260,
        },
      }),
    },
  });
};

import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { converseEventEmitter } from "@utils/events";
import { useCallback } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Terms from "./Terms";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { Button } from "../../design-system/Button/Button";
import { useKeyboardAnimation } from "../../utils/animations/keyboardAnimation";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import Picto from "../Picto/Picto";

type Props = {
  title: string;
  picto?: string | undefined;
  subtitle?: string | React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
  backButtonText?: string;
  backButtonAction?: () => void;
  primaryButtonText?: string;
  primaryButtonAction?: () => void;
  shrinkWithKeyboard?: boolean;
  inModal?: boolean;
  inNav?: boolean;
  loadingSubtitle?: string;
  showTerms?: boolean;
};

export default function OnboardingComponent({
  title,
  picto,
  subtitle,
  isLoading,
  children,
  backButtonText,
  backButtonAction,
  primaryButtonText,
  primaryButtonAction,
  shrinkWithKeyboard,
  inModal,
  inNav,
  loadingSubtitle,
  showTerms = false,
}: Props) {
  const styles = useStyles(showTerms);

  const { loading: stateLoading, setLoading } = useOnboardingStore(
    useSelect(["loading", "setLoading", "address"])
  );
  const showDebug = useCallback(() => {
    converseEventEmitter.emit("showDebugMenu");
  }, []);
  const loading = stateLoading || isLoading;

  const { height: keyboardHeight } = useKeyboardAnimation();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: keyboardHeight.value,
    };
  }, [keyboardHeight]);

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      {backButtonText && (
        <Button
          action="text"
          picto={
            backButtonText.toLowerCase().includes("back")
              ? "chevron.left"
              : undefined
          }
          title={backButtonText}
          style={[
            styles.backButton,
            !backButtonText.toLowerCase().includes("back")
              ? { paddingLeft: 16 }
              : {},
          ]}
          textStyle={{
            bottom: Platform.OS === "android" ? 1 : undefined,
          }}
          onPress={() => {
            setLoading(false);
            if (backButtonAction) {
              backButtonAction();
            }
          }}
        />
      )}
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={styles.onboardingContent}
        keyboardShouldPersistTaps="handled"
      >
        {picto && (
          <Picto
            picto={picto}
            size={PictoSizes.onboardingComponent}
            style={[styles.picto, inModal ? { marginTop: 50 } : {}]}
          />
        )}
        {!picto && <View style={{ marginTop: inNav ? 32 : 140 }} />}

        <Text style={styles.title} onLongPress={showDebug}>
          {title}
        </Text>
        {loading && (
          <ActivityIndicator size="large" style={{ marginTop: 30 }} />
        )}
        {!loading && (
          <>
            {subtitle && <Text style={styles.p}>{subtitle}</Text>}
            {children}
            <View style={{ flexGrow: 1, minHeight: 32 }} />
            {primaryButtonText && (
              <Button
                title={primaryButtonText}
                action="primary"
                style={styles.primaryButton}
                onPress={primaryButtonAction}
              />
            )}
            {showTerms && (
              <View style={styles.termsContainer}>
                <Terms />
              </View>
            )}
          </>
        )}
        {loading && loadingSubtitle && (
          <Text style={styles.p}>{loadingSubtitle}</Text>
        )}
      </ScrollView>
      {shrinkWithKeyboard && <Animated.View style={animatedStyle} />}
    </View>
  );
}

const useStyles = (showTerms: boolean) => {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  return StyleSheet.create({
    onboardingContent: {
      flexGrow: 1,
      alignItems: "center",
      backgroundColor: backgroundColor(colorScheme),
    },
    backButton: {
      alignSelf: "flex-start",
      paddingVertical: 8,
      marginTop: insets.top,
      width: Platform.OS === "android" ? 100 : undefined,
      marginLeft: Platform.OS === "android" ? 10 : undefined,
    },
    picto: {
      marginBottom: Platform.OS === "ios" ? 8 : 20,
      height: 64,
    },
    title: {
      textAlign: "center",
      ...Platform.select({
        default: {
          fontWeight: "600",
          fontSize: 34,
          lineHeight: 40,
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 24,
          color: textPrimaryColor(colorScheme),
        },
      }),
    },
    p: {
      textAlign: "center",
      marginTop: 8,
      marginLeft: 32,
      marginRight: 32,
      ...Platform.select({
        default: {
          fontSize: 16,
          lineHeight: 20,
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
    primaryButton: {
      marginBottom: showTerms ? 16 : 51,
    },
    termsContainer: {
      marginBottom: 35,
    },
  });
};

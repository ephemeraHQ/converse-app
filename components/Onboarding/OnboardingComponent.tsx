import {
  Platform,
  StyleSheet,
  useColorScheme,
  Text,
  View,
  ScrollView,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { useKeyboardAnimation } from "../../utils/animations/keyboardAnimation";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import Button from "../Button/Button";
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
}: Props) {
  const styles = useStyles();
  const { loading: stateLoading, setLoading } = useOnboardingStore(
    useSelect(["loading", "setLoading"])
  );
  const loading = stateLoading || isLoading;

  const { height: keyboardHeight } = useKeyboardAnimation();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: keyboardHeight.value,
    };
  }, [keyboardHeight]);

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={styles.onboardingContent}
        keyboardShouldPersistTaps="handled"
      >
        {picto && (
          <Picto
            picto={picto}
            size={Platform.OS === "android" ? 80 : 43}
            style={[styles.picto, inModal ? { marginTop: 50 } : {}]}
          />
        )}
        {!picto && <View style={{ marginTop: inNav ? 32 : 140 }} />}

        <Text style={styles.title}>{title}</Text>
        {loading && (
          <ActivityIndicator size="large" style={{ marginTop: 30 }} />
        )}
        {!loading && (
          <>
            {subtitle && <Text style={styles.p}>{subtitle}</Text>}
            {children}
            <View style={{ height: 32 }} />
            {primaryButtonText && (
              <Button
                title={primaryButtonText}
                variant="primary"
                style={{
                  marginTop: "auto",
                  marginBottom: !backButtonText ? 51 : 21,
                }}
                onPress={primaryButtonAction}
              />
            )}
          </>
        )}
        {loading && loadingSubtitle && (
          <Text style={styles.p}>{loadingSubtitle}</Text>
        )}
        {backButtonText && (
          <Button
            variant="text"
            title={backButtonText}
            textStyle={{ fontWeight: "600" }}
            style={{
              marginBottom: 51,
              marginTop: primaryButtonText && !loading ? 0 : "auto",
            }}
            onPress={() => {
              setLoading(false);
              if (backButtonAction) {
                backButtonAction();
              }
            }}
          />
        )}
      </ScrollView>
      {shrinkWithKeyboard && <Animated.View style={animatedStyle} />}
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    onboardingContent: {
      flexGrow: 1,
      alignItems: "center",
      backgroundColor: backgroundColor(colorScheme),
    },

    picto: {
      ...Platform.select({
        default: {
          marginTop: 140,
          marginBottom: 60,
        },
        android: {
          marginTop: 165,
          marginBottom: 61,
        },
      }),
    },
    title: {
      textAlign: "center",
      ...Platform.select({
        default: {
          fontWeight: "700",
          fontSize: 34,
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
      marginTop: 21,
      marginLeft: 32,
      marginRight: 32,
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
  });
};

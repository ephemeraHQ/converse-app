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
import { useKeyboardAnimation } from "../../utils/animations/keyboardAnimation";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { pick } from "../../utils/objects";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import Button from "../Button/Button";
import Picto from "../Picto/Picto";

type Props = {
  title: string;
  picto: string;
  subtitle?: string | React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
  backButtonText?: string;
  backButtonAction?: () => void;
  primaryButtonText?: string;
  primaryButtonAction?: () => void;
  shrinkWithKeyboard?: boolean;
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
}: Props) {
  const styles = useStyles();
  const { loading: stateLoading, setLoading } = useOnboardingStore((s) =>
    pick(s, ["loading", "setLoading"])
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
        <Picto
          picto={picto}
          size={Platform.OS === "android" ? 80 : 43}
          style={styles.picto}
        />

        <Text style={styles.title}>{title}</Text>
        {loading && (
          <ActivityIndicator size="large" style={{ marginTop: 30 }} />
        )}
        {!loading && (
          <>
            {subtitle && <Text style={styles.p}>{subtitle}</Text>}
            {children}
            <View style={{ height: 25 }} />
            {primaryButtonText && (
              <Button
                title={primaryButtonText}
                variant="primary"
                style={[
                  styles.primaryButton,
                  { marginBottom: !backButtonText ? 53 : 21 },
                ]}
                onPress={primaryButtonAction}
              />
            )}
            {backButtonText && (
              <Button
                variant="text"
                title={backButtonText}
                textStyle={{ fontWeight: "600" }}
                style={{
                  marginBottom: 53,
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
          </>
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
    back: {
      marginTop: "auto",
      marginBottom: 54,
    },
    primaryButton: {
      marginBottom: 21,
      marginTop: "auto",
    },
  });
};

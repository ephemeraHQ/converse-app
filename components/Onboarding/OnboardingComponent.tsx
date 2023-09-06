import {
  Platform,
  StyleSheet,
  useColorScheme,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";

import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import Button from "../Button/Button";
import Picto from "../Picto/Picto";

type Props = {
  loading?: boolean;
  title: string;
  picto: string;
  subtitle?: string | React.ReactNode;
  view: React.ReactNode;
  backButtonText?: string;
  backButtonAction?: () => void;
  primaryButtonText?: string;
  primaryButtonAction?: () => void;
  keyboardVerticalOffset?: number;
};

export default function OnboardingComponent({
  loading,
  title,
  picto,
  subtitle,
  view,
  backButtonText,
  backButtonAction,
  primaryButtonText,
  primaryButtonAction,
  keyboardVerticalOffset,
}: Props) {
  const styles = useStyles();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      enabled={Dimensions.get("window").height < 850}
      behavior="position"
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={styles.onboardingContent}
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
        {subtitle && <Text style={styles.p}>{subtitle}</Text>}
        {view}
        {primaryButtonText && (
          <Button
            title={primaryButtonText}
            variant="primary"
            style={[styles.primaryButton]}
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
              marginTop: primaryButtonText ? 0 : "auto",
            }}
            onPress={backButtonAction}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    onboardingContent: {
      minHeight: "100%",
      alignItems: "center",
      backgroundColor: backgroundColor(colorScheme),
    },
    picto: {
      ...Platform.select({
        default: {
          marginTop: 124,
          marginBottom: 98,
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

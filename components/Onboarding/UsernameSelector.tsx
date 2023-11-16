import React, { useState, FC } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";

import { useCurrentAccount } from "../../data/store/accountsStore";
import { claimUserName } from "../../utils/api";
import {
  textInputStyle,
  textPrimaryColor,
  textSecondaryColor,
  dangerColor,
} from "../../utils/colors";
import { sentryTrackError } from "../../utils/sentry";
import OnboardingComponent from "./OnboardingComponent";

interface UsernameSelectorProps {
  onDismiss?: () => void;
  onSuccess: (name: string) => void;
}

export const UsernameSelector: FC<UsernameSelectorProps> = ({
  onDismiss,
  onSuccess,
}) => {
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const userAddress = useCurrentAccount();
  const colorScheme = useColorScheme();
  const styles = useStyles(colorScheme, errorMessage);

  const handleDismiss = () => {
    // Only available if presented as a modal, outside of the Privy signup flow
    if (onDismiss) onDismiss();
  };

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      if (userAddress) {
        const data = await claimUserName(username, userAddress);
        console.log("User name set:", data);
        onSuccess(username);
        if (onDismiss) onDismiss();
      }
    } catch (error: any) {
      const message = error.response?.data?.error || "Unknown error occurred";
      setErrorMessage(message);
      setIsLoading(false);

      sentryTrackError(error);
      console.error(
        "Error in UsernameSelector:",
        message,
        userAddress,
        username
      );
    }
  };

  return (
    <OnboardingComponent
      title="User name"
      picto="person"
      primaryButtonText="Continue"
      primaryButtonAction={handleContinue}
      backButtonText={onDismiss ? "Back" : ""}
      backButtonAction={handleDismiss}
      shrinkWithKeyboard
      isLoading={isLoading}
    >
      <View style={styles.usernameInputContainer}>
        <TextInput
          style={[textInputStyle(colorScheme), styles.usernameInput]}
          onChangeText={setUsername}
          value={username}
          placeholder="username"
          placeholderTextColor={textSecondaryColor(colorScheme)}
          autoCapitalize="none"
        />
        <Text style={styles.p}>
          {errorMessage ||
            "This is how people will find you and how you will appear to others."}
        </Text>
      </View>
    </OnboardingComponent>
  );
};

const useStyles = (colorScheme: any, errorMessage: any) =>
  StyleSheet.create({
    usernameInputContainer: {
      width: "100%",
      paddingHorizontal: 32,
      marginTop: 50,
    },
    usernameInput: {
      width: "100%",
    },
    p: {
      textAlign: "center",
      marginTop: 20,
      marginLeft: 25,
      marginRight: 25,
      ...Platform.select({
        default: {
          fontSize: 17,
          color: errorMessage
            ? dangerColor(colorScheme)
            : textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: errorMessage
            ? dangerColor(colorScheme)
            : textSecondaryColor(colorScheme),
          maxWidth: 260,
        },
      }),
    },
  });

export default UsernameSelector;

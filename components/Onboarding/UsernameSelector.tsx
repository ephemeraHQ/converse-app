import axios from "axios";
import React, { useState, FC } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";

import config from "../../config";
import { useCurrentAccount } from "../../data/store/accountsStore";
import {
  textInputStyle,
  textPrimaryColor,
  textSecondaryColor,
  dangerColor,
} from "../../utils/colors";
import { getXmtpApiHeaders } from "../../utils/xmtpRN/client";
import OnboardingComponent from "./OnboardingComponent";

const api = axios.create({
  baseURL: config.apiURI,
});

interface UsernameSelectorProps {
  onDismiss: () => void;
}

export const UsernameSelector: FC<UsernameSelectorProps> = ({ onDismiss }) => {
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const userAddress = useCurrentAccount();
  const colorScheme = useColorScheme();
  const styles = useStyles(colorScheme, errorMessage);

  const handleDismiss = () => {
    // Only available if presented as a modal, outside of the Privy signup flow
    onDismiss();
  };

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      if (userAddress) {
        const { data } = await api.post(
          "/api/profile/username",
          { username, address: userAddress },
          { headers: await getXmtpApiHeaders(userAddress) }
        );
        setIsLoading(false);
        console.log("User name set:", data.message);
        onDismiss();
      }
    } catch (error: any) {
      const message = error.response?.data?.error || "Unknown error occurred";
      setErrorMessage(message);
      setIsLoading(false);

      // Set this as an error so it's logged in sentry
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
      backButtonText="Back"
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
      height: 130,
      paddingHorizontal: 25,
      marginTop: 50,
      marginBottom: 20,
    },
    usernameInput: {
      width: "100%",
    },
    p: {
      textAlign: "center",
      marginTop: 21,
      marginLeft: 32,
      marginRight: 32,
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

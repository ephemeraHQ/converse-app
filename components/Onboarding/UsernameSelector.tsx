import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";

import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
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

export const UsernameSelector = () => {
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const userAddress = useCurrentAccount();
  const colorScheme = useColorScheme();
  const styles = useStyles(colorScheme, errorMessage);

  useEffect(() => {
    console.log(`** [UsernameSelector] Refreshing profile for ${userAddress}`);
    const handleIdentityState = async () => {
      if (userAddress) {
        setIsLoading(true);
        await refreshProfileForAddress(userAddress, userAddress);
        setIsLoading(false);
        console.log(`** Refreshed profile for ${userAddress}`);
      }
    };
    handleIdentityState();
  }, [userAddress]);

  const handleContinue = useCallback(async () => {
    try {
      setIsLoading(true);
      if (userAddress) {
        await claimUserName(username, userAddress);
        await refreshProfileForAddress(userAddress, userAddress);
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
  }, [userAddress, username]);

  return (
    <OnboardingComponent
      title="User name"
      picto="person"
      primaryButtonText="Continue"
      primaryButtonAction={handleContinue}
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
          onSubmitEditing={handleContinue}
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
        },
      }),
    },
  });

export default UsernameSelector;

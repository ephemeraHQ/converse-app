import React, { useState, FC } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";

import {
  textInputStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import OnboardingComponent from "./OnboardingComponent";

interface UsernameSelectorProps {
  onDismiss: () => void;
}

export const UsernameSelector: FC<UsernameSelectorProps> = ({ onDismiss }) => {
  const [username, setUsername] = useState<string>("");
  const colorScheme = useColorScheme();
  const styles = useStyles(colorScheme);

  const handleDismiss = () => {
    // Only available if presented as a modal, outside of the Privy signup flow
    onDismiss();
  };

  const handleContinue = () => {};

  return (
    <OnboardingComponent
      title="Username"
      picto="person"
      primaryButtonText="Continue"
      primaryButtonAction={handleContinue}
      backButtonText="Back"
      backButtonAction={handleDismiss}
      shrinkWithKeyboard
    >
      <View style={styles.usernameInputContainer}>
        <TextInput
          style={[textInputStyle(colorScheme), styles.usernameInput]}
          onChangeText={setUsername}
          value={username}
          placeholder="Enter your username"
          placeholderTextColor={textSecondaryColor(colorScheme)}
        />
        <Text style={styles.p}>
          This is how people will find you and how you will appear to others.
        </Text>
      </View>
    </OnboardingComponent>
  );
};

const useStyles = (colorScheme: any) =>
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

export default UsernameSelector;

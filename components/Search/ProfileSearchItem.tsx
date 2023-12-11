import { useNavigationState } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";

import { ProfileSocials } from "../../data/store/profilesStore";
import {
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getPreferredName, getPrimaryNames } from "../../utils/profile";
import { shortAddress } from "../../utils/str";
import Button from "../Button/Button";

export function ProfileSearchItem({
  address,
  socials,
  navigation,
  isVisible,
}: {
  address: string;
  socials: ProfileSocials;
  navigation?: NativeStackNavigationProp<any>;
  isVisible: boolean;
}) {
  const styles = useStyles();
  const preferredName = getPreferredName(socials, address);
  const primaryNames = getPrimaryNames(socials);
  const primaryNamesDisplay = primaryNames.filter(
    (name) => name !== preferredName
  );
  const navigationIndex = useNavigationState((state) => state.index);

  return (
    <View key={address} style={[styles.recommendationBorderBottom]}>
      <View style={styles.recommendationLeft}>
        <Text style={[styles.recommendationTitle]}>
          {preferredName || shortAddress(address)}
        </Text>
        {primaryNamesDisplay.length > 0 && (
          <Text style={[styles.recommendationText]}>
            {primaryNamesDisplay.join(" | ")}
          </Text>
        )}
      </View>
      {navigation && (
        <View style={styles.recommendationRight}>
          <Button
            variant={Platform.OS === "android" ? "text" : "secondary"}
            picto="message"
            title="Chat"
            style={styles.cta}
            onPress={() => {
              // On Android the accounts are not in the navigation but in a drawer
              navigation.pop(
                Platform.OS === "ios" ? navigationIndex - 1 : navigationIndex
              );
              setTimeout(() => {
                console.log("open main convo with:", address);
                navigation.navigate("Conversation", {
                  mainConversationWithPeer: address,
                  focus: true,
                });
              }, 300);
            }}
          />
        </View>
      )}
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    // ... other styles ...
    recommendationBorderBottom: {
      borderBottomWidth: 0.5,
      borderBottomColor: itemSeparatorColor(colorScheme),
      paddingVertical: 16, // Adjust vertical padding for each cell
      flexDirection: "row", // Align items in a row
      justifyContent: "space-between", // This will place items on each end
      alignItems: "center", // Align items vertically
    },
    recommendationLeft: {
      flex: 1, // Take up all available space
      justifyContent: "center", // Center content vertically
    },
    recommendationRight: {
      justifyContent: "center",
    },
    recommendationTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: textPrimaryColor(colorScheme),
      marginBottom: 3,
    },
    recommendationText: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
      alignSelf: "flex-start",
    },
    cta: {
      paddingHorizontal: 5, // Add padding around the button
      marginRight: 14,
    },
    recommendation: {
      flexDirection: "row",
      paddingRight: 5,
      ...Platform.select({
        default: {
          paddingVertical: 15,
        },
        android: { paddingVertical: 12 },
      }),
    },
    recommendationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 3,
    },
  });
};

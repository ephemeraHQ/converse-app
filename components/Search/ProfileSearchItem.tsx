import { useNavigationState } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Text, View, useColorScheme } from "react-native";

import { ProfileSocials } from "../../data/store/profilesStore";
import {
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getPreferredName, getPrimaryNames } from "../../utils/profile";
import { shortAddress } from "../../utils/str";
import { NavigationChatButton } from "../Chat/ChatActionButton";

export function ProfileSearchItem({
  address,
  socials,
  navigation,
}: {
  address: string;
  socials: ProfileSocials;
  navigation?: NativeStackNavigationProp<any>;
}) {
  const styles = useStyles();
  const preferredName = getPreferredName(socials, address);
  const primaryNames = getPrimaryNames(socials);
  const primaryNamesDisplay = primaryNames.filter(
    (name) => name !== preferredName
  );
  const navigationIndex = useNavigationState((state) => state.index);

  return (
    <View key={address} style={[styles.container]}>
      <View style={styles.left}>
        <Text style={[styles.title]}>
          {preferredName || shortAddress(address)}
        </Text>
        {primaryNamesDisplay.length > 0 && (
          <Text style={[styles.text]}>{primaryNamesDisplay.join(" | ")}</Text>
        )}
      </View>
      {navigation && (
        <View style={styles.right}>
          <NavigationChatButton
            navigation={navigation}
            address={address}
            navigationIndex={navigationIndex}
          />
        </View>
      )}
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      borderBottomWidth: 0.5,
      borderBottomColor: itemSeparatorColor(colorScheme),
      paddingVertical: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    left: {
      flex: 1,
      justifyContent: "center",
    },
    right: {
      justifyContent: "center",
    },
    title: {
      fontSize: 17,
      fontWeight: "600",
      color: textPrimaryColor(colorScheme),
      marginBottom: 3,
    },
    text: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
      alignSelf: "flex-start",
    },
  });
};

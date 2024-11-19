import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";

import { ProfileSocials } from "@data/store/profilesStore";
import {
  getPreferredAvatar,
  getPreferredName,
  getPrimaryNames,
} from "@utils/profile";
import { shortAddress } from "@utils/str";
import Avatar from "@components/Avatar";
import { NavigationChatButton } from "./NavigationChatButton";

export function ProfileSearchItem({
  address,
  socials,
  navigation,
  groupMode,
  addToGroup,
}: {
  address: string;
  socials: ProfileSocials;
  navigation?: NativeStackNavigationProp<any>;
  groupMode?: boolean;
  addToGroup?: (member: ProfileSocials & { address: string }) => void;
}) {
  const styles = useStyles();
  const preferredName = getPreferredName(socials, address);
  const preferredAvatar = getPreferredAvatar(socials);
  const primaryNames = getPrimaryNames(socials);
  const primaryNamesDisplay = [
    ...primaryNames.filter((name) => name !== preferredName),
    shortAddress(address),
  ];

  return (
    <View key={address} style={styles.container}>
      <View style={styles.left}>
        <Avatar
          uri={preferredAvatar}
          size={AvatarSizes.listItemDisplay}
          style={styles.avatar}
          name={preferredName}
        />
        <View>
          <Text style={styles.title}>
            {preferredName || shortAddress(address)}
          </Text>
          {primaryNamesDisplay.length > 0 && (
            <Text numberOfLines={1} style={styles.text}>
              {primaryNamesDisplay.join(" | ")}
            </Text>
          )}
        </View>
      </View>
      {navigation && (
        <View style={styles.right}>
          <NavigationChatButton
            navigation={navigation}
            address={address}
            groupMode={groupMode}
            addToGroup={
              addToGroup ? () => addToGroup({ ...socials, address }) : undefined
            }
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
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      marginRight: 13,
    },
    right: {
      justifyContent: "center",
      marginLeft: Platform.OS === "ios" ? 30 : 0,
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
      marginRight: 20,
    },
  });
};

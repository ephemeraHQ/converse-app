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

  const textAlign = "left";

  return (
    <View key={address} style={[styles.recommendationBorderBottom]}>
      <View style={styles.recommendationLeft}>
        <Text style={[styles.recommendationTitle, { textAlign }]}>
          {preferredName || shortAddress(address)}
        </Text>

        {primaryNamesDisplay.length > 0 && (
          <Text
            style={[styles.recommendationText, { textAlign, width: undefined }]}
          >
            {primaryNamesDisplay.join(" | ")}
          </Text>
        )}
      </View>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    recommendation: {
      flexDirection: "row",
      paddingRight: 10,
      ...Platform.select({
        default: {
          paddingVertical: 15,
        },
        android: { paddingVertical: 12 },
      }),
    },
    recommendationBorderBottom: {
      ...Platform.select({
        default: {
          borderBottomWidth: 0.5,
          borderBottomColor: itemSeparatorColor(colorScheme),
        },
        android: {},
      }),
    },
    recommendationLeft: {
      flexGrow: 1,
      flexShrink: 1,
    },
    recommendationRight: {
      justifyContent: "center",
    },
    recommendationTitle: {
      width: "100%",
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 17,
          fontWeight: "600",
          marginBottom: 3,
          marginRight: 110,
        },
        android: {
          fontSize: 16,
        },
      }),
    },
    recommendationText: {
      color: textSecondaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 15,
        },
        android: {
          fontSize: 14,
        },
      }),
      alignSelf: "flex-start",
    },
    recommendationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 3,
    },
    recommendationImage: {
      width: 15,
      height: 15,
      marginRight: 10,
    },
    cta: {
      marginRight: 0,
      marginLeft: "auto",
    },
  });
};

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileSocials } from "../../data/store/profilesStore";
import {
  backgroundColor,
  itemSeparatorColor,
  textSecondaryColor,
} from "../../utils/colors";
import { ProfileSearchItem } from "./ProfileSearchItem";

export default function ProfileSearch({
  navigation,
  profiles,
}: {
  navigation: NativeStackNavigationProp<any>;
  profiles: { [address: string]: ProfileSocials };
}) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const keyExtractor = useCallback((address: string) => address, []);
  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      if (item === "title") {
        return (
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>RESULTS</Text>
          </View>
        );
      } else if (item === "bottomline") {
        return <View style={{ marginBottom: insets.bottom + 40 }} />;
      }
      return (
        <ProfileSearchItem
          address={item}
          socials={profiles[item]}
          navigation={navigation}
        />
      );
    },
    [
      profiles,
      navigation,
      styles.sectionTitleContainer,
      styles.sectionTitle,
      insets.bottom,
    ]
  );

  return (
    <View style={styles.profileSearch}>
      <FlatList
        data={["title", ...Object.keys(profiles), "bottomline"]}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onTouchStart={Keyboard.dismiss}
      />
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    profileSearch: {
      backgroundColor: backgroundColor(colorScheme),
      marginLeft: 16,
    },
    sectionTitleContainer: {
      ...Platform.select({
        default: {
          borderBottomWidth: 0.5,
          borderBottomColor: itemSeparatorColor(colorScheme),
        },
        android: {},
      }),
    },
    sectionTitle: {
      color: textSecondaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 12,
          marginBottom: 8,
          marginTop: 23,
        },
        android: {
          fontSize: 11,
          marginBottom: 12,
          marginTop: 16,
        },
      }),
    },
  });
};

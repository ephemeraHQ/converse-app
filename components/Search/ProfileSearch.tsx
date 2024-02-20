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
    ({ item }: { item: string }) => (
      <ProfileSearchItem
        address={item}
        socials={profiles[item]}
        navigation={navigation}
      />
    ),
    [profiles, navigation]
  );

  const renderHeader = () => (
    <View style={styles.sectionTitleContainer}>
      <Text style={styles.sectionTitle}>RESULTS</Text>
    </View>
  );

  const renderFooter = () => (
    <View style={[styles.footer, { marginBottom: insets.bottom + 55 }]}>
      <Text style={styles.message}>
        If you don't see your contact in the list, try typing their full address
        (with .converse.xyz, .eth, .lens, .fc, .x etc…)
      </Text>
    </View>
  );

  return (
    <View style={styles.profileSearch}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={Object.keys(profiles)}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
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
      paddingLeft: 16,
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
    footer: {
      ...Platform.select({
        default: {
          marginTop: 23,
          marginRight: 16,
        },
        android: {
          marginRight: 16,
          marginLeft: 16,
          marginTop: 16,
        },
      }),
    },
    message: {
      ...Platform.select({
        default: {
          fontSize: 17,
          textAlign: "center",
        },
        android: {
          fontSize: 14,
        },
      }),
      color: textSecondaryColor(colorScheme),
    },
  });
};

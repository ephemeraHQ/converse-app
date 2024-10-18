import { translate } from "@i18n";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { backgroundColor, textSecondaryColor } from "@styles/colors";
import { getPreferredName, getProfile } from "@utils/profile";
import { useCallback, useState } from "react";
import { Alert, Platform, StyleSheet, useColorScheme } from "react-native";
import { useShallow } from "zustand/react/shallow";

import {
  currentAccount,
  useProfilesStore,
} from "../../data/store/accountsStore";
import { useIsSplitScreen } from "../../screens/Navigation/navHelpers";
import { navigate } from "../../utils/navigation";
import { canGroupMessage } from "../../utils/xmtpRN/conversations";
import Button from "../Button/Button";

type NavigationChatProps = {
  navigation: NativeStackNavigationProp<any>;
  address: string;
  groupMode?: boolean;
  addToGroup?: () => void;
};

export function NavigationChatButton({
  navigation,
  address,
  groupMode,
  addToGroup,
}: NavigationChatProps) {
  const styles = useStyles();
  const isSplitScreen = useIsSplitScreen();
  const [loading, setLoading] = useState(false);
  const profile = useProfilesStore(
    useShallow((s) => getProfile(address, s.profiles))
  );
  const preferredName = getPreferredName(profile?.socials, address);
  const openChat = useCallback(() => {
    // On Android the accounts are not in the navigation but in a drawer
    if (Platform.OS !== "web") {
      const parent = navigation.getParent();
      parent?.goBack();
    }
    setTimeout(
      () => {
        navigate("Conversation", {
          mainConversationWithPeer: address,
          focus: true,
        });
      },
      isSplitScreen ? 0 : 300
    );
  }, [address, isSplitScreen, navigation]);

  const addToGroupIfPossible = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const allowed = await canGroupMessage(currentAccount(), address);
    setLoading(false);
    // canGroupMessage() returns lowercase addresses
    if (!allowed[address.toLowerCase()]) {
      Alert.alert(
        translate("cannot_be_added_to_group_yet", {
          name: preferredName,
        })
      );
      return;
    }
    addToGroup?.();
  }, [loading, address, addToGroup, preferredName]);

  return (
    <Button
      variant={
        Platform.OS === "android" || Platform.OS === "web" ? "link" : "outline"
      }
      title={groupMode ? (loading ? "Adding..." : "Add") : "Chat"}
      style={[styles.navigationButton, loading ? styles.loading : {}]}
      textStyle={loading ? styles.loadingText : undefined}
      onPress={
        groupMode ? (loading ? undefined : addToGroupIfPossible) : openChat
      }
    />
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    navigationButton: {
      paddingHorizontal: 5,
      marginLeft: 0,
      marginRight: 16,
    },
    loading: {
      backgroundColor: textSecondaryColor(colorScheme),
      borderRadius: 20,
    },
    loadingText: {
      color: Platform.OS === "ios" ? undefined : backgroundColor(colorScheme),
    },
  });
};

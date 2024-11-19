import { translate } from "@i18n";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getPreferredName, getProfile } from "@utils/profile";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { useShallow } from "zustand/react/shallow";

import { currentAccount, useProfilesStore } from "@data/store/accountsStore";
import { navigate } from "@utils/navigation";
import { canGroupMessage } from "@utils/xmtpRN/conversations";
import { Button } from "@design-system/Button/Button";
import { useAppTheme } from "@theme/useAppTheme";

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
  const { theme } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const profile = useProfilesStore(
    useShallow((s) => getProfile(address, s.profiles))
  );
  const preferredName = getPreferredName(profile?.socials, address);
  const isCurrentUser =
    address.toLowerCase() === currentAccount().toLowerCase();

  const openChat = useCallback(() => {
    // On Android the accounts are not in the navigation but in a drawer

    const parent = navigation.getParent();
    parent?.goBack();

    setTimeout(() => {
      navigate("Conversation", {
        mainConversationWithPeer: address,
        focus: true,
      });
    }, 300);
  }, [address, navigation]);

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
        isCurrentUser ? "fill" : Platform.OS === "android" ? "link" : "outline"
      }
      style={{
        marginRight: theme.spacing.xs,
      }}
      text={
        isCurrentUser
          ? "You"
          : groupMode
            ? loading
              ? translate("add_loading")
              : translate("add")
            : translate("chat")
      }
      onPress={
        isCurrentUser
          ? undefined
          : groupMode
            ? loading
              ? undefined
              : addToGroupIfPossible
            : openChat
      }
      disabled={isCurrentUser}
    />
  );
}

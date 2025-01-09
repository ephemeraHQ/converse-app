import { translate } from "@i18n";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";

import { getCurrentInboxId } from "@data/store/accountsStore";
import { Button } from "@design-system/Button/Button";
import { useRouter } from "@navigation/useNavigation";
import { isCurrentUser } from "@shared/utils/user";
import { useAppTheme } from "@theme/useAppTheme";
import { navigate } from "@utils/navigation";
import { canMessageByAccount } from "@utils/xmtpRN/contacts";
import { usePreferredName } from "@/hooks/usePreferredName";

type NavigationChatProps = {
  inboxId: string;
  groupMode?: boolean;
  addToGroup?: () => void;
};

export function NavigationChatButton({
  inboxId,
  groupMode,
  addToGroup,
}: NavigationChatProps) {
  const { theme } = useAppTheme();

  const navigation = useRouter();

  const [loading, setLoading] = useState(false);
  const preferredName = usePreferredName({ inboxId });
  const isCurrentUserInboxId = isCurrentUser(inboxId);

  const openChat = useCallback(() => {
    // On Android the accounts are not in the navigation but in a drawer
    navigation.popToTop();

    navigate("Conversation", {
      peerInboxId: inboxId,
    });
  }, [inboxId, navigation]);

  const addToGroupIfPossible = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const allowed = await canMessageByAccount({
      inboxId: getCurrentInboxId()!,
      peer: inboxId,
    });
    setLoading(false);
    // canGroupMessage() returns lowercase addresses
    if (!allowed) {
      Alert.alert(
        translate("cannot_be_added_to_group_yet", {
          name: preferredName,
        })
      );
      return;
    }
    addToGroup?.();
  }, [loading, inboxId, addToGroup, preferredName]);

  const getButtonText = () => {
    if (isCurrentUserInboxId) return translate("you");
    if (groupMode) {
      return loading ? translate("add_loading") : translate("add");
    }
    return translate("chat");
  };

  const getButtonAction = () => {
    if (isCurrentUserInboxId) return undefined;
    if (groupMode) {
      return loading ? undefined : addToGroupIfPossible;
    }
    return openChat;
  };

  return (
    <Button
      variant={
        isCurrentUserInboxId
          ? "fill"
          : Platform.OS === "android"
            ? "link"
            : "outline"
      }
      style={{
        marginRight: theme.spacing.xs,
      }}
      text={getButtonText()}
      onPress={getButtonAction()}
      disabled={isCurrentUserInboxId}
    />
  );
}

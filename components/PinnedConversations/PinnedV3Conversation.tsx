import { useConversationListGroupItem } from "@hooks/useConversationListGroupItem";
import { PinnedConversation } from "./PinnedConversation";
import { usePinnedConversationLongPress } from "../../features/conversation-list/usePinnedConversationLongPress";
import { useCallback, useEffect, useMemo } from "react";
import { navigate } from "@utils/navigation";
import Avatar from "@components/Avatar";
import { AvatarSizes } from "@styles/sizes";
import { useGroupConversationListAvatarInfo } from "../../features/conversation-list/useGroupConversationListAvatarInfo";
import { useCurrentAccount } from "@data/store/accountsStore";
import { GroupAvatarDumb } from "@components/GroupAvatar";

export const PinnedV3Conversation = ({ topic }: { topic: string }) => {
  const group = useConversationListGroupItem(topic);
  const currentAccount = useCurrentAccount();
  const { memberData } = useGroupConversationListAvatarInfo(
    currentAccount!,
    group
  );

  const onLongPress = usePinnedConversationLongPress(topic);
  const onPress = useCallback(() => {
    navigate("Conversation", { topic });
  }, [topic]);

  const title = group?.name;
  const showUnread = false;

  useEffect(() => {
    if (!group) return;
    if (group.imageUrlSquare) return;
  }, [group]);

  const avatarComponent = useMemo(() => {
    if (group?.imageUrlSquare) {
      return (
        <Avatar
          key={group?.topic}
          uri={group?.imageUrlSquare}
          size={AvatarSizes.pinnedConversation}
        />
      );
    }
    return (
      <GroupAvatarDumb
        size={AvatarSizes.pinnedConversation}
        members={memberData}
        style={{ marginLeft: 16, alignSelf: "center" }}
      />
    );
  }, [group?.imageUrlSquare, group?.topic, memberData]);

  return (
    <PinnedConversation
      avatarComponent={avatarComponent}
      onLongPress={onLongPress}
      onPress={onPress}
      showUnread={showUnread}
      title={title ?? ""}
    />
  );
};

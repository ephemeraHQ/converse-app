import React from "react";
import { View } from "react-native";
import { Chip } from "@/design-system/chip";
import { useAppTheme } from "@/theme/useAppTheme";
import { createConversationStyles } from "../create-conversation.styles";
import { PendingMembersSectionProps } from "../create-conversation.types";
import { getPreferredAvatar, getPreferredName } from "@/utils/profile";

/**
 * Displays chips for pending chat members that can be removed
 * by clicking on them.
 *
 * @param props.members - Array of pending chat members
 * @param props.onRemoveMember - Callback when a member chip is pressed
 */
export function PendingMembersSection({
  members,
  onRemoveMember,
}: PendingMembersSectionProps) {
  const { themed } = useAppTheme();

  if (!members.length) return null;

  return (
    <View style={themed(createConversationStyles.$pendingMembersSection)}>
      {members.map((member) => {
        const preferredName = getPreferredName(member, member.address);

        return (
          <Chip
            key={member.address}
            name={preferredName}
            avatarUri={getPreferredAvatar(member)}
            onPress={() => onRemoveMember(member.address)}
          />
        );
      })}
    </View>
  );
}

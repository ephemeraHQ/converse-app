import { usePreferredInboxAddress } from "@/hooks/usePreferredInboxAddress";
import { usePreferredInboxAvatar } from "@/hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { shortAddress } from "@/utils/strings/shortAddress";
import { Avatar } from "@components/Avatar";
import { Text } from "@design-system/Text";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { TextStyle, View, ViewStyle } from "react-native";

type UserSearchResultListItemProps = {
  inboxId: string;
};

/**
 * Search result list item for an individual user (as opposed to a group)
 * Figma: https://www.figma.com/design/p6mt4tEDltI4mypD3TIgUk/Converse-App?node-id=5191-4200&t=KDRZMuK1xpiNBKG9-11
 */
export function ConversationSearchResultsListItemUser({
  inboxId,
}: UserSearchResultListItemProps) {
  const { theme, themed } = useAppTheme();
  const { data: preferredName } = usePreferredInboxName({
    inboxId,
  });

  const { data: preferredAddress } = usePreferredInboxAddress({
    inboxId,
  });

  const { data: preferredAvatar } = usePreferredInboxAvatar({
    inboxId,
  });

  return (
    <View style={themed($container)}>
      <Avatar
        uri={preferredAvatar}
        size={theme.avatarSize.md}
        style={themed($avatar)}
        name={preferredName}
      />
      <View style={themed($textContainer)}>
        <Text preset="bodyBold" style={themed($primaryText)} numberOfLines={1}>
          {preferredName}
        </Text>
        <Text
          preset="formLabel"
          style={themed($secondaryText)}
          numberOfLines={1}
        >
          {shortAddress(inboxId)}
        </Text>
      </View>
    </View>
  );
}

const $container: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
  borderWidth,
}) => ({
  borderBottomWidth: borderWidth.sm,
  borderBottomColor: colors.border.subtle,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  flexDirection: "row",
  justifyContent: "flex-start",
  alignItems: "center",
  backgroundColor: colors.background.surface,
  gap: spacing.sm,
});

const $textContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  minWidth: 0,
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
});

const $avatar: ThemedStyle<ViewStyle> = () => ({
  width: 40,
  height: 40,
  borderRadius: 24,
  overflow: "hidden",
});

const $primaryText: ThemedStyle<TextStyle> = () => ({
  lineHeight: 20,
});

const $secondaryText: ThemedStyle<TextStyle> = ({ colors }) => ({
  lineHeight: 18,
  color: colors.text.secondary,
  fontSize: 14,
});

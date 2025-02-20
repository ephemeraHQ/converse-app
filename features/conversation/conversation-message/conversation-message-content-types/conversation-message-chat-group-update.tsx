import { Center } from "@/design-system/Center";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { Avatar } from "@/components/avatar";
import { HStack } from "@design-system/HStack";
import { Pressable } from "@design-system/Pressable";
import { ITextProps, Text } from "@design-system/Text";
import { TxKeyPath, translate } from "@i18n";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { navigate } from "@utils/navigation";
import {
  DecodedMessage,
  GroupUpdatedCodec,
  GroupUpdatedMetadatEntry,
  InboxId,
} from "@xmtp/react-native-sdk";
import { memo } from "react";
import { ViewStyle } from "react-native";

type IMessageChatGroupUpdateProps = {
  message: DecodedMessage<GroupUpdatedCodec>;
};

export function MessageChatGroupUpdate({
  message,
}: IMessageChatGroupUpdateProps) {
  const { theme } = useAppTheme();

  const content = message.content();

  if (typeof content === "string") {
    // TODO
    return null;
  }

  return (
    <Center
      style={{
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        flexWrap: "wrap",
        rowGap: theme.spacing.sm,
      }}
    >
      {/* Member additions */}
      {content.membersAdded.map((member) => (
        <ChatGroupMemberJoined
          key={`joined-${member.inboxId}`}
          inboxId={member.inboxId as InboxId}
        />
      ))}

      {/* Member removals */}
      {content.membersRemoved.map((member) => (
        <ChatGroupMemberLeft
          key={`left-${member.inboxId}`}
          inboxId={member.inboxId as InboxId}
        />
      ))}

      {/* Metadata changes */}
      {content.metadataFieldsChanged.map((entry, index) => (
        <ChatGroupMetadataUpdate
          key={`metadata-${index}`}
          metadataEntry={entry}
          initiatorInboxId={content.initiatedByInboxId as InboxId}
        />
      ))}
    </Center>
  );
}

type IChatGroupMemberLeftProps = {
  inboxId: InboxId;
};

function ChatGroupMemberLeft({ inboxId }: IChatGroupMemberLeftProps) {
  const { themed, theme } = useAppTheme();

  const { data: profile } = useProfileQuery({
    xmtpId: inboxId,
  });

  if (!profile) {
    return null;
  }

  return (
    <HStack style={themed($memberContainer)}>
      <Pressable
        style={themed($pressableContent)}
        onPress={() => {
          navigate("Profile", {
            inboxId,
          });
        }}
      >
        <Avatar
          size={theme.avatarSize.xs}
          uri={profile.avatar}
          name={profile.name}
        />
        <ChatGroupUpdateText weight="bold">
          {profile?.name}{" "}
        </ChatGroupUpdateText>
      </Pressable>
      <ChatGroupUpdateText>
        {translate("group_member_left")}
      </ChatGroupUpdateText>
    </HStack>
  );
}

type IChatGroupMemberJoinedProps = {
  inboxId: InboxId;
};

function ChatGroupMemberJoined({ inboxId }: IChatGroupMemberJoinedProps) {
  const { themed, theme } = useAppTheme();

  const { data: profile } = useProfileQuery({
    xmtpId: inboxId,
  });

  if (!profile) {
    return null;
  }

  return (
    <HStack style={themed($memberContainer)}>
      <Pressable
        onPress={() => {
          navigate("Profile", {
            inboxId,
          });
        }}
        style={themed($pressableContent)}
      >
        <Avatar
          size={theme.avatarSize.xs}
          uri={profile.avatar}
          name={profile.name}
        />
        <ChatGroupUpdateText weight="bold">{profile.name} </ChatGroupUpdateText>
      </Pressable>
      <ChatGroupUpdateText>
        {translate("group_member_joined")}
      </ChatGroupUpdateText>
    </HStack>
  );
}

type IChatGroupMetadataUpdateProps = {
  metadataEntry: GroupUpdatedMetadatEntry;
  initiatorInboxId: InboxId;
};

function ChatGroupMetadataUpdate({
  metadataEntry,
  initiatorInboxId,
}: IChatGroupMetadataUpdateProps) {
  const { themed, theme } = useAppTheme();

  const { data: profile } = useProfileQuery({
    xmtpId: initiatorInboxId,
  });

  if (!profile) {
    return null;
  }

  let txKey: TxKeyPath;
  let txParams: Record<string, string> = {};

  switch (metadataEntry.fieldName) {
    case "group_name":
      txKey = "group_name_changed_to";
      txParams = { newValue: metadataEntry.newValue };
      break;
    case "group_image_url_square":
      txKey = "group_photo_changed";
      break;
    case "description":
      txKey = "group_description_changed";
      txParams = { newValue: metadataEntry.newValue };
      break;
    default:
      return null;
  }

  return (
    <HStack style={themed($memberContainer)}>
      <Pressable
        onPress={() => {
          navigate("Profile", {
            inboxId: initiatorInboxId,
          });
        }}
        style={themed($pressableContent)}
      >
        <Avatar
          size={theme.avatarSize.xs}
          uri={profile.avatar}
          name={profile.name}
        />
        <ChatGroupUpdateText weight="bold">{profile.name} </ChatGroupUpdateText>
      </Pressable>
      <ChatGroupUpdateText>{translate(txKey, txParams)}</ChatGroupUpdateText>
    </HStack>
  );
}

const ChatGroupUpdateText = memo(function ChatGroupUpdateText(
  props: ITextProps
) {
  const { style, ...rest } = props;
  return (
    <Text
      style={[{ textAlign: "center" }, style]}
      color="secondary"
      preset="smaller"
      {...rest}
    />
  );
});

const $memberContainer: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "center",
});

const $pressableContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  columnGap: spacing.xxxs,
  alignItems: "center",
  flexDirection: "row",
});

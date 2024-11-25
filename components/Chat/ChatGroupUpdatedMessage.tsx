import Avatar from "@components/Avatar";
import { useCurrentAccount } from "@data/store/accountsStore";
import { HStack } from "@design-system/HStack";
import { Pressable } from "@design-system/Pressable";
import { ITextProps, Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { TxKeyPath, translate } from "@i18n";
import { useInboxProfileSocialsQuery } from "@queries/useInboxProfileSocialsQuery";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { navigate } from "@utils/navigation";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import {
  GroupUpdatedContent,
  GroupUpdatedMetadatEntry,
  InboxId,
} from "@xmtp/react-native-sdk";
import { memo } from "react";
import { ViewStyle } from "react-native";

type IChatGroupUpdatedMessageProps = {
  content: GroupUpdatedContent;
};

export function ChatGroupUpdatedMessage({
  content,
}: IChatGroupUpdatedMessageProps) {
  const { themed } = useAppTheme();

  return (
    <VStack style={themed($container)}>
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
    </VStack>
  );
}

type IChatGroupMemberLeftProps = {
  inboxId: InboxId;
};

export function ChatGroupMemberLeft({ inboxId }: IChatGroupMemberLeftProps) {
  const { themed } = useAppTheme();
  const currentAccount = useCurrentAccount();
  const { data } = useInboxProfileSocialsQuery(currentAccount!, inboxId);
  const { theme } = useAppTheme();

  const firstSocials = data?.[0];

  if (!firstSocials) {
    return null;
  }

  const readableName = getPreferredName(
    firstSocials,
    firstSocials.address ?? ""
  );
  const avatarUri = getPreferredAvatar(firstSocials);

  return (
    <HStack style={themed($memberContainer)}>
      <Pressable
        style={themed($pressableContent)}
        onPress={() => {
          navigate("Profile", {
            address: firstSocials.address ?? "",
          });
        }}
      >
        <Avatar
          size={theme.avatarSize.xs}
          uri={avatarUri}
          name={readableName}
        />
        <ChatGroupUpdateText weight="bold">{readableName} </ChatGroupUpdateText>
      </Pressable>
      <ChatGroupUpdateText>
        {translate("group_member_joined")}
      </ChatGroupUpdateText>
    </HStack>
  );
}

type IChatGroupMemberJoinedProps = {
  inboxId: InboxId;
};

function ChatGroupMemberJoined({ inboxId }: IChatGroupMemberJoinedProps) {
  const { themed } = useAppTheme();
  const currentAccount = useCurrentAccount();
  const { data } = useInboxProfileSocialsQuery(currentAccount!, inboxId);
  const { theme } = useAppTheme();

  const firstSocials = data?.[0];

  if (!firstSocials) {
    return null;
  }

  const readableName = getPreferredName(
    firstSocials,
    firstSocials.address ?? ""
  );
  const avatarUri = getPreferredAvatar(firstSocials);

  return (
    <HStack style={themed($memberContainer)}>
      <Pressable
        onPress={() => {
          navigate("Profile", {
            address: firstSocials.address ?? "",
          });
        }}
        style={themed($pressableContent)}
      >
        <Avatar
          size={theme.avatarSize.xs}
          uri={avatarUri}
          name={readableName}
        />
        <ChatGroupUpdateText weight="bold">{readableName} </ChatGroupUpdateText>
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
  const { themed } = useAppTheme();
  const currentAccount = useCurrentAccount();
  const { data } = useInboxProfileSocialsQuery(
    currentAccount!,
    initiatorInboxId
  );
  const { theme } = useAppTheme();

  const firstSocials = data?.[0];

  if (!firstSocials) {
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

  const readableName = getPreferredName(
    firstSocials,
    firstSocials.address ?? ""
  );

  const avatarUri = getPreferredAvatar(firstSocials);

  return (
    <HStack style={themed($memberContainer)}>
      <Pressable
        onPress={() => {
          navigate("Profile", {
            address: firstSocials.address ?? "",
          });
        }}
        style={themed($pressableContent)}
      >
        <Avatar
          size={theme.avatarSize.xs}
          uri={avatarUri}
          name={readableName}
        />
        <ChatGroupUpdateText weight="bold">{readableName} </ChatGroupUpdateText>
      </Pressable>
      <ChatGroupUpdateText>{translate(txKey, txParams)}</ChatGroupUpdateText>
    </HStack>
  );
}

const ChatGroupUpdateText = memo(function ChatGroupUpdateText(
  props: ITextProps
) {
  return <Text color="secondary" preset="smaller" {...props} />;
});

const $container: ThemedStyle<ViewStyle> = () => ({
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
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

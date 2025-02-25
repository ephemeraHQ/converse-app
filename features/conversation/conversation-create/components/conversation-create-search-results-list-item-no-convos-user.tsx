import { memo, useCallback } from "react";
import { Alert } from "react-native";
import { Avatar } from "@/components/avatar";
import { Chip, ChipText } from "@/design-system/chip";
import { HStack } from "@/design-system/HStack";
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store";
import {
  ConversationSearchResultsListItem,
  ConversationSearchResultsListItemTitle,
} from "@/features/conversation/conversation-create/components/conversation-create-search-result-list-item";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api";
import { useXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query";
import { useAppTheme } from "@/theme/use-app-theme";

type IConversationSearchResultsListItemNoConvosUserProps = {
  socialProfile: ISocialProfile;
};

export const ConversationSearchResultsListItemNoConvosUser = memo(
  function ConversationSearchResultsListItemNoConvosUser({
    socialProfile: socialProfile,
  }: IConversationSearchResultsListItemNoConvosUserProps) {
    const { theme } = useAppTheme();

    const conversationStore = useConversationStore();

    const currentSender = useSafeCurrentSender();

    const { data: inboxId, isLoading: isLoadingInboxId } =
      useXmtpInboxIdFromEthAddressQuery({
        clientEthAddress: currentSender.ethereumAddress,
        targetEthAddress: socialProfile.address,
      });

    const handlePress = useCallback(() => {
      if (inboxId) {
        conversationStore.setState({
          searchTextValue: "",
          searchSelectedUserInboxIds: [
            ...(conversationStore.getState().searchSelectedUserInboxIds ?? []),
            inboxId,
          ],
        });
      } else {
        Alert.alert("This user is not on XMTP yet!");
      }
    }, [inboxId, conversationStore]);

    if (isLoadingInboxId) {
      return null;
    }

    return (
      <ConversationSearchResultsListItem
        avatar={
          <Avatar
            size={theme.avatarSize.md}
            uri={socialProfile.avatar}
            name={socialProfile.name}
          />
        }
        title={
          <HStack
            style={{
              alignItems: "center",
              columnGap: theme.spacing.xxxs,
            }}
          >
            <ConversationSearchResultsListItemTitle>
              {socialProfile.name}
            </ConversationSearchResultsListItemTitle>
            <Chip size="xs">
              <ChipText>Not a Convos user</ChipText>
            </Chip>
            {!inboxId && (
              <Chip size="xs">
                <ChipText>Not on XMTP</ChipText>
              </Chip>
            )}
          </HStack>
        }
        subtitle={socialProfile.address}
        onPress={handlePress}
      />
    );
  },
);

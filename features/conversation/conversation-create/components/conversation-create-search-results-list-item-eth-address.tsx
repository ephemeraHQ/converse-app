import { memo } from "react";
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
import { useXmtpInboxIdFromEthAddressQuery } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address.query";
import { useAppTheme } from "@/theme/use-app-theme";
import { shortAddress } from "@/utils/strings/shortAddress";

type Props = {
  ethAddress: string;
};

export const ConversationSearchResultsListItemEthAddress = memo(
  function ConversationSearchResultsListItemEthAddress(props: Props) {
    const { ethAddress } = props;
    const { theme } = useAppTheme();

    const conversationStore = useConversationStore();

    const currentSender = useSafeCurrentSender();

    const { data: inboxId, isLoading: isLoadingInboxId } =
      useXmtpInboxIdFromEthAddressQuery({
        clientEthAddress: currentSender.ethereumAddress,
        targetEthAddress: ethAddress,
      });

    const handlePress = () => {
      if (!inboxId) {
        Alert.alert("This user is not on XMTP yet!");
        return;
      }

      conversationStore.setState({
        searchTextValue: "",
        searchSelectedUserInboxIds: [
          ...(conversationStore.getState().searchSelectedUserInboxIds ?? []),
          inboxId,
        ],
      });
    };

    if (isLoadingInboxId) {
      return null;
    }

    return (
      <ConversationSearchResultsListItem
        avatar={
          <Avatar
            uri={undefined}
            size={theme.avatarSize.md}
            name={ethAddress}
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
              {shortAddress(ethAddress)}
            </ConversationSearchResultsListItemTitle>
          </HStack>
        }
        subtitle={
          !inboxId ? (
            <HStack
              style={{
                alignItems: "center",
                columnGap: theme.spacing.xxxs,
              }}
            >
              <Chip size="xs">
                <ChipText>Not on XMTP</ChipText>
              </Chip>
            </HStack>
          ) : undefined
        }
        onPress={handlePress}
      />
    );
  },
);

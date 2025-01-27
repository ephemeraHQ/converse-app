import { Loader } from "@/design-system/loader";
import { useSendMessage } from "@/features/conversation/hooks/use-send-message";
import { ComposerSection } from "@/features/create-conversation/components/composer-section";
import { MessageSection } from "@/features/create-conversation/components/message-section";
import { UserInlineSearch } from "@/features/create-conversation/components/user-inline-search";
import { SearchResultsList } from "@/features/search/components/ProfileSearchResultsList";
import { useHeader } from "@/navigation/use-header";
import { useSearchUsersQuery } from "@/queries/search-users.query";
import { setConversationQueryData } from "@/queries/useConversationQuery";
import { useAppTheme } from "@/theme/useAppTheme";
import logger, { logJson } from "@/utils/logger";
import { getPreferredAvatar, getPreferredName } from "@/utils/profile";
import {
  createConversationByAccount,
  createGroupWithDefaultsByAccount,
  getOptionalConversationByPeerByAccount,
} from "@/utils/xmtpRN/conversations";
import { currentAccount, getCurrentAccount } from "@data/store/accountsStore";
import { ConversationVersion } from "@xmtp/react-native-sdk";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useFindConversationByMembers } from "../conversation-list/hooks/use-conversations-count";
import { IProfileSocials } from "../profiles/profile-types";
import { createConversationStyles } from "./create-conversation.styles";
import { CreateConversationScreenProps } from "./create-conversation.types";

/**
 * Screen for creating new conversations
 * Supports creating both DMs and group chats
 */
export function CreateConversationScreen({
  navigation,
}: CreateConversationScreenProps) {
  const { themed } = useAppTheme();
  const [conversationMode, setConversationMode] = useState<ConversationVersion>(
    ConversationVersion.DM
  );
  const { sendMessage, error } = useSendMessage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<
    Array<{
      address: string;
      name: string;
      socials: IProfileSocials;
    }>
  >([]);
  const {
    conversations: existingConversations,
    isLoading: isLoadingExistingConversation,
  } = useFindConversationByMembers(selectedUsers.map((u) => u.address));
  logJson({ json: existingConversations, msg: "existingConversations" });

  const selectedUsersCount = selectedUsers.length;
  const composerDisabled = selectedUsersCount === 0;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (selectedUsersCount > 1) {
      setConversationMode(ConversationVersion.GROUP);
    } else if (selectedUsersCount === 1) {
      setConversationMode(ConversationVersion.DM);
    }
  }, [selectedUsersCount]);

  const { theme } = useAppTheme();

  useHeader({
    title: "New chat",
    safeAreaEdges: ["top"],
    onBack: handleBack,
    style: {
      borderBottomWidth: theme.borderWidth.sm,
      borderBottomColor: theme.colors.border.subtle,
    },
  });

  const selectedAddresses = selectedUsers.map((u) => u.address);
  const currentUserAddress = getCurrentAccount() || "";

  const { searchResults, areSearchResultsLoading, hasSearchResults } =
    useSearchUsersQuery({
      searchQuery,
      addressesToOmit: [...selectedAddresses, currentUserAddress],
    });

  const inputRef = useRef<TextInput | null>(null);
  const initialFocus = useRef(false);

  const onRef = useCallback(
    (r: TextInput | null) => {
      if (!initialFocus.current) {
        initialFocus.current = true;
        if (!searchQuery) {
          logger.debug("[CreateConversation] Auto-focusing input");
          setTimeout(() => {
            r?.focus();
          }, 100);
        }
      }
      inputRef.current = r;
    },
    [searchQuery]
  );

  const handleSendMessage = async (content: { text: string }) => {
    const messageText = content.text;
    if (!messageText) return;

    if (conversationMode === ConversationVersion.DM) {
      let dm = await getOptionalConversationByPeerByAccount({
        account: currentAccount(),
        peer: selectedUsers[0].address,
        includeSync: true,
      });
      if (!dm) {
        dm = await createConversationByAccount(
          currentAccount(),
          selectedUsers[0].address
        );
      }
      await sendMessage({
        topic: dm.topic,
        content: { text: messageText },
      });
      setConversationQueryData({
        account: currentAccount(),
        topic: dm.topic,
        conversation: dm,
      });
      navigation.replace("Conversation", { topic: dm.topic });
    } else {
      //todo(lustig) lookup group by list of addresses/inbox ids and optimstically create one if not found
      // use useFindGroupByPeerIds
      const group = await createGroupWithDefaultsByAccount({
        account: currentAccount(),
        peerEthereumAddresses: selectedUsers.map((m) => m.address),
      });
      await sendMessage({
        topic: group.topic,
        content: { text: messageText },
      });
      setConversationQueryData({
        account: currentAccount(),
        topic: group.topic,
        conversation: group,
      });
      navigation.replace("Conversation", { topic: group.topic });
    }
  };

  const handleSearchResultPress = useCallback(
    ({ address, socials }: { address: string; socials: IProfileSocials }) => {
      setSelectedUsers((prev) => [
        ...prev,
        {
          address,
          name: getPreferredName(socials, address),
          socials,
        },
      ]);
      setSearchQuery("");
    },
    []
  );

  return (
    <View style={themed(createConversationStyles.$screenContainer)}>
      <UserInlineSearch
        value={searchQuery}
        onChangeText={setSearchQuery}
        onRef={onRef}
        placeholder="Name, address or onchain ID"
        selectedUsers={selectedUsers.map((u) => ({
          address: u.address,
          name: u.name,
          avatarUri: getPreferredAvatar(u.socials),
        }))}
        onRemoveUser={(address: string) => {
          setSelectedUsers((prev) => prev.filter((u) => u.address !== address));
        }}
      />

      {!areSearchResultsLoading && hasSearchResults && (
        <SearchResultsList
          searchResults={searchResults}
          handleSearchResultItemPress={handleSearchResultPress}
        />
      )}

      {/* {message && <MessageSection message={message} />} */}

      {error && <MessageSection message={error.message} />}

      {areSearchResultsLoading && (
        <View style={{ flex: 1 }}>
          <Loader size="large" />
        </View>
      )}

      {existingConversations && (
        <MessageSection
          message={`${
            existingConversations.length
          } conversations already exist with ${selectedUsers
            .map((u) => u.name)
            .join(", ")}`}
          isError={false}
        />
      )}

      {!existingConversations && !isLoadingExistingConversation && (
        <MessageSection
          message={"Conversation does not exist with those members"}
          isError={false}
        />
      )}
      <ComposerSection
        disabled={composerDisabled}
        conversationMode={conversationMode}
        onSend={handleSendMessage}
      />
    </View>
  );
}

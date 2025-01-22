import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import { useAppTheme } from "@/theme/useAppTheme";
import { createConversationStyles } from "./create-conversation.styles";
import { useHeader } from "@/navigation/use-header";
import { ConversationVersion } from "@xmtp/react-native-sdk";
import { currentAccount, getCurrentAccount } from "@data/store/accountsStore";
import { isEmptyObject } from "@/utils/objects";
import { setConversationQueryData } from "@/queries/useConversationQuery";
import {
  createConversationByAccount,
  createGroupWithDefaultsByAccount,
  getOptionalConversationByPeerByAccount,
} from "@/utils/xmtpRN/conversations";
import {
  sendMessage,
  useSendMessage,
} from "@/features/conversation/hooks/use-send-message";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import {
  ComposerSection,
  MessageSection,
  UserInlineSearch,
} from "./components";
import { ProfileSearchResultsList } from "@/features/search/components/ProfileSearchResultsList";
import {
  CreateConversationScreenProps,
  SearchStatus,
} from "./create-conversation.types";
import { IProfileSocials } from "../profiles/profile-types";
import { getPreferredAvatar, getPreferredName } from "@/utils/profile";
import { useQuery } from "@tanstack/react-query";
import { getSearchQueryOptions, useSearchQuery } from "@/queries/search-query";
import { Loader } from "@/design-system/loader";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<
    Array<{
      address: string;
      name: string;
      socials: IProfileSocials;
    }>
  >([]);

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

  const {
    profileSearchResults,
    areSearchResultsLoading,
    hasSearchResults,
    message,
  } = useSearchQuery({
    searchQuery,
    addressesToOmit: [...selectedAddresses, currentUserAddress],
  });

  const sendMessage = useSendMessage();

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
    try {
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
    } catch (e) {
      const errorString = (e as Error)?.message || `Something went wrong`;
      captureErrorWithToast(e);
      setErrorMessage(errorString);
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
      setErrorMessage("");
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

      {!areSearchResultsLoading && !errorMessage && hasSearchResults && (
        <ProfileSearchResultsList
          profiles={profileSearchResults!}
          handleSearchResultItemPress={handleSearchResultPress}
        />
      )}

      {message && <MessageSection message={message} />}

      {areSearchResultsLoading && (
        <View style={{ flex: 1 }}>
          <Loader size="large" />
        </View>
      )}

      <ComposerSection
        disabled={composerDisabled}
        conversationMode={conversationMode}
        onSend={handleSendMessage}
      />
    </View>
  );
}

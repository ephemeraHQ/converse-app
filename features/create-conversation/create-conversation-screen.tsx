import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useAppTheme } from "@/theme/useAppTheme";
import { createConversationStyles } from "./create-conversation.styles";
import { SearchBar } from "@/features/search/components/SearchBar";
import { useHeader } from "@/navigation/use-header";
import { ConversationVersion } from "@xmtp/react-native-sdk";
import { currentAccount, getCurrentAccount } from "@data/store/accountsStore";
import { accountCanMessagePeer } from "@/features/consent/account-can-message-peer";
import { searchProfiles } from "@/utils/api/profiles";
import { getAddressForPeer, isSupportedPeer } from "@/utils/evm/address";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import { shortAddress } from "@/utils/strings/shortAddress";
import { isEmptyObject } from "@/utils/objects";
import { setProfileRecordSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { setConversationQueryData } from "@/queries/useConversationQuery";
import {
  createConversationByAccount,
  createGroupWithDefaultsByAccount,
  getOptionalConversationByPeerByAccount,
} from "@/utils/xmtpRN/conversations";
import { sendMessage } from "@/features/conversation/hooks/use-send-message";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import {
  ComposerSection,
  MessageSection,
  PendingMembersSection,
  SearchResultsSection,
} from "./components";
import {
  CreateConversationScreenProps,
  PendingChatMembers,
  SearchStatus,
} from "./create-conversation.types";

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
  const searchQueryRef = useRef("");
  const [status, setStatus] = useState<SearchStatus>({
    loading: false,
    message: "",
    inviteToConverse: "",
    profileSearchResults: {},
  });

  const [pendingChatMembers, setPendingChatMembers] =
    useState<PendingChatMembers>({
      members: [],
    });

  const pendingChatMembersCount = pendingChatMembers.members.length;
  const composerDisabled = pendingChatMembersCount === 0;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (pendingChatMembersCount > 1) {
      setConversationMode(ConversationVersion.GROUP);
    } else if (pendingChatMembersCount === 1) {
      setConversationMode(ConversationVersion.DM);
    }
  }, [pendingChatMembersCount]);

  useHeader({
    title: "New chat",
    safeAreaEdges: ["top"],
    onBack: handleBack,
  });

  const debounceDelay = 200;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    logger.info("[CreateConversation] Search effect triggered", {
      searchQuery,
    });

    if (searchQuery.length === 0) {
      setStatus({
        loading: false,
        message: "",
        inviteToConverse: "",
        profileSearchResults: {},
      });
      return;
    }

    if (debounceTimer.current !== null) {
      logger.info("[CreateConversation] Clearing existing debounce timer");
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const searchForValue = async () => {
        logger.info("[CreateConversation] Starting search after debounce", {
          searchQuery,
        });
        setStatus((prev) => ({
          ...prev,
          message: "",
          inviteToConverse: "",
          profileSearchResults: {},
        }));

        if (isSupportedPeer(searchQuery)) {
          logger.info("[CreateConversation] Searching for supported peer", {
            searchQuery,
          });
          setStatus((prev) => ({ ...prev, loading: true }));
          searchQueryRef.current = searchQuery;
          const resolvedAddress = await getAddressForPeer(searchQuery);

          if (searchQueryRef.current === searchQuery) {
            if (!resolvedAddress) {
              setStatus({
                loading: false,
                profileSearchResults: {},
                inviteToConverse: "",
                message: "No address has been set for this domain.",
              });
              return;
            }

            const address = getCleanAddress(resolvedAddress);
            logger.info("[CreateConversation] Checking if address is on XMTP", {
              address,
            });
            const addressIsOnXmtp = await accountCanMessagePeer({
              account: currentAccount(),
              peer: address,
            });

            if (searchQueryRef.current === searchQuery) {
              if (addressIsOnXmtp) {
                logger.info(
                  "[CreateConversation] Address found on XMTP, searching profiles",
                  {
                    address,
                    searchQuery,
                  }
                );
                const profiles = await searchProfiles(
                  address,
                  currentAccount()
                );

                if (!isEmptyObject(profiles)) {
                  logger.info(
                    "[CreateConversation] Found and saving profiles",
                    {
                      profileCount: Object.keys(profiles).length,
                    }
                  );
                  setProfileRecordSocialsQueryData(profiles);
                  pendingChatMembers.members.forEach((member) => {
                    delete profiles[member.address];
                  });
                  delete profiles[getCurrentAccount()!.toLowerCase()];
                  setStatus({
                    loading: false,
                    message: "",
                    inviteToConverse: "",
                    profileSearchResults: profiles,
                  });
                } else {
                  logger.info(
                    "[CreateConversation] No profiles found for XMTP user"
                  );
                  setStatus({
                    loading: false,
                    message: "",
                    inviteToConverse: "",
                    profileSearchResults: {},
                  });
                }
              } else {
                logger.info("[CreateConversation] Address not on XMTP", {
                  searchQuery,
                  address,
                });
                setStatus({
                  loading: false,
                  message: `${shortAddress(
                    searchQuery
                  )} is not on the XMTP network yet`,
                  inviteToConverse: searchQuery,
                  profileSearchResults: {},
                });
              }
            }
          }
        } else {
          logger.info(
            "[CreateConversation] Searching profiles for non-peer searchQuery",
            { searchQuery }
          );
          setStatus((prev) => ({ ...prev, loading: true }));

          const profiles = await searchProfiles(searchQuery, currentAccount());

          if (!isEmptyObject(profiles)) {
            logger.info("[CreateConversation] Found and saving profiles", {
              searchQuery,
              profileCount: Object.keys(profiles).length,
            });
            setProfileRecordSocialsQueryData(profiles);
            delete profiles[getCurrentAccount()!.toLowerCase()];
            setStatus({
              loading: false,
              message: "",
              inviteToConverse: "",
              profileSearchResults: profiles,
            });
          } else {
            logger.info("[CreateConversation] No profiles found", {
              searchQuery,
            });
            setStatus({
              loading: false,
              message: `No profiles found for ${searchQuery}`,
              inviteToConverse: "",
              profileSearchResults: {},
            });
          }
        }
      };
      searchForValue();
    }, debounceDelay);

    return () => {
      if (debounceTimer.current !== null) {
        logger.info("[CreateConversation] Cleanup: clearing debounce timer");
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, pendingChatMembers.members]);

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
          peer: pendingChatMembers.members[0].address,
          includeSync: true,
        });
        if (!dm) {
          dm = await createConversationByAccount(
            currentAccount(),
            pendingChatMembers.members[0].address
          );
        }
        await sendMessage({
          conversation: dm,
          params: {
            content: { text: messageText },
          },
        });
        setConversationQueryData({
          account: currentAccount(),
          topic: dm.topic,
          conversation: dm,
        });
        navigation.replace("Conversation", { topic: dm.topic });
      } else {
        const group = await createGroupWithDefaultsByAccount({
          account: currentAccount(),
          peerEthereumAddresses: pendingChatMembers.members.map(
            (m) => m.address
          ),
        });
        await sendMessage({
          conversation: group,
          params: {
            content: { text: messageText },
          },
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
      setStatus({
        loading: false,
        message: errorString,
        inviteToConverse: "",
        profileSearchResults: {},
      });
    }
  };

  return (
    <View style={themed(createConversationStyles.$screenContainer)}>
      <SearchBar
        value={searchQuery}
        setValue={setSearchQuery}
        onRef={onRef}
        inputPlaceholder="Name, address or onchain ID"
      />

      <PendingMembersSection
        members={pendingChatMembers.members}
        onRemoveMember={(address) => {
          setPendingChatMembers((prev) => ({
            ...prev,
            members: prev.members.filter((m) => m.address !== address),
          }));
        }}
      />

      {!status.loading &&
        !status.message &&
        !isEmptyObject(status.profileSearchResults) && (
          <SearchResultsSection
            profiles={status.profileSearchResults}
            onSelectProfile={({ socials, address }) => {
              setPendingChatMembers((prev) => ({
                ...prev,
                members: [...prev.members, { ...socials, address }],
              }));
              setSearchQuery("");
            }}
          />
        )}

      {status.message && (
        <MessageSection
          message={status.message}
          isError={!status.inviteToConverse}
        />
      )}

      {status.loading && <View style={{ flex: 1 }} />}

      <ComposerSection
        disabled={composerDisabled}
        conversationMode={conversationMode}
        onSend={handleSendMessage}
      />
    </View>
  );
}

import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useAppTheme } from "@/theme/useAppTheme";
import { createConversationStyles } from "./create-conversation.styles";
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
  UserInlineSearch,
} from "./components";
import { ProfileSearchResultsList } from "@/features/search/components/ProfileSearchResultsList";
import {
  CreateConversationScreenProps,
  SearchStatus,
} from "./create-conversation.types";
import { IProfileSocials } from "../profiles/profile-types";
import { getPreferredName } from "@/utils/profile";

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
                  const selectedAddresses = selectedUsers.map((u) => u.address);
                  Object.keys(profiles).forEach((addr) => {
                    if (
                      selectedAddresses.includes(addr.toLowerCase()) ||
                      addr.toLowerCase() === getCurrentAccount()?.toLowerCase()
                    ) {
                      delete profiles[addr];
                    }
                  });
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
                  const madeupprofiles: Record<string, IProfileSocials> = {
                    [address]: {
                      address: address,
                    },
                  };
                  setStatus({
                    loading: false,
                    message: "",
                    inviteToConverse: "",
                    profileSearchResults: madeupprofiles,
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
                  )} is not on the XMTP network yet 😏`,
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
            const selectedAddresses = selectedUsers.map((u) => u.address);
            Object.keys(profiles).forEach((addr) => {
              if (
                selectedAddresses.includes(addr.toLowerCase()) ||
                addr.toLowerCase() === getCurrentAccount()?.toLowerCase()
              ) {
                delete profiles[addr];
              }
            });
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
  }, [searchQuery, selectedUsers]);

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
          peerEthereumAddresses: selectedUsers.map((m) => m.address),
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
      setStatus((prev) => ({ ...prev, profileSearchResults: {} }));
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
        }))}
        onRemoveUser={(address: string) => {
          setSelectedUsers((prev) => prev.filter((u) => u.address !== address));
        }}
      />

      {!status.loading &&
        !status.message &&
        !isEmptyObject(status.profileSearchResults) && (
          <ProfileSearchResultsList
            profiles={status.profileSearchResults}
            handleSearchResultItemPress={handleSearchResultPress}
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

/**
 * BUGS:
 *
 * chat is not loaded properly from cold start until chat is visited
 * solution: proper persistence
 *
 * chat flow feels slow on app first launch
 * solution: proper persistence
 *
 * group flow feels slow
 * solution: requires diagnosing bottleneck
 *
 * conversation list is not updated with most recent dm when sent from composer
 * solution: maybe using the hook instead of imperatively doing stuff?
 *
 * group name creation not correct: getting first preferred name correct but
 * ✅ not using correct preferred name for last two when ephemeral accounts
 *
 * messed up old add user to existing group screen
 * ✅ solution: copy existing screen back in
 *
 * UI:
 *
 * ✅ search results list needs updating
 * ✅ create chips for search results
 * ✅ composer disable send button
 * ✅ composer hide plus button
 * ✅ pending members list
 *
 * new group joined the group welcome message needs wrapping (not my problem atm)
 *
 * CODE ORG:
 * change file names to lower-kebab-case
 * move files to features/new-conversation
 * rename files to indicate where they live within new-conversation domain
 * use proper suffixes
 *
 * ---
 *
 * GITHUB:
 * https://github.com/ephemeraHQ/converse-app/issues/1498
 *
 * FIGMA:
 * new composer: https://www.figma.com/design/p6mt4tEDltI4mypD3TIgUk/Converse-App?node-id=5026-26989&m=dev
 * search results list: https://www.figma.com/design/p6mt4tEDltI4mypD3TIgUk/Converse-App?node-id=5191-4200&t=KDRZMuK1xpiNBKG9-4
 */
import { Text } from "@/design-system/Text";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, ScrollView, TextInput, View } from "react-native";

import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import { SearchBar } from "@search/components/SearchBar";
import { canMessageByAccount } from "@utils/xmtpRN/contacts";
import { ConversationTopic, ConversationVersion } from "@xmtp/react-native-sdk";
import AndroidBackAction from "@components/AndroidBackAction";
import { currentAccount } from "@data/store/accountsStore";
import { IProfileSocials } from "@/features/profiles/profile-types";
import { searchProfiles } from "@utils/api";
import { getAddressForPeer, isSupportedPeer } from "@utils/evm/address";
import { isEmptyObject } from "@utils/objects";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { setProfileRecordSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { useAppTheme } from "@/theme/useAppTheme";
import { Loader } from "@/design-system/loader";
import logger from "@/utils/logger";
import { ProfileSearchResultsList } from "@/features/search/components/ProfileSearchResultsList";
import { Composer } from "@/features/conversation/conversation-composer/conversation-composer";
import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { ConversationComposerContainer } from "@/features/conversation/conversation-composer/conversation-composer-container";
import { ConversationKeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";
import { shortAddress } from "@/utils/strings/shortAddress";
import {
  createConversationByAccount,
  createGroupWithDefaultsByAccount,
  getOptionalConversationByPeerByAccount,
} from "@/utils/xmtpRN/conversations";
import { setConversationQueryData } from "@/queries/useConversationQuery";
import { sendMessage } from "@/features/conversation/hooks/use-send-message";
import { useNavigation } from "@react-navigation/native";
import { Button } from "@/design-system/Button/Button";
import { stylesNewChat } from "./newChat.styles";
import { Chip } from "@/design-system/chip";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigationParamList } from "../Navigation/Navigation";

/**
 * Screen shown for when user wants to create a new Chat.
 *
 * User can search for peers, create a new group, create a dm,
 * or navigate to an existing dm.
 */
type NavigationProps = NativeStackNavigationProp<
  NavigationParamList,
  "NewConversation"
>;

export default function NewConversation({
  navigation,
}: {
  navigation: NavigationProps;
}) {
  const { theme, themed } = useAppTheme();
  const [conversationCreationMode, setConversationCreationMode] =
    useState<ConversationVersion>(ConversationVersion.DM);
  // const navigation = useNavigation();

  const handleBack = useCallback(() => {
    logger.debug("[NewConversation] Navigating back");
    navigation.goBack();
  }, [navigation]);

  const [pendingChatMembers, setPendingGroupMembers] = useState({
    members: [] as (IProfileSocials & { address: string })[],
  });
  const pendingChatMembersCount = pendingChatMembers.members.length;
  const composerSendButtonDisabled = pendingChatMembersCount === 0;

  useEffect(() => {
    if (pendingChatMembersCount > 1) {
      setConversationCreationMode(ConversationVersion.GROUP);
    } else if (pendingChatMembersCount === 1) {
      setConversationCreationMode(ConversationVersion.DM);
    }
  }, [pendingChatMembersCount]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logger.debug("[NewConversation] Setting navigation options", {
      memberCount: pendingChatMembersCount,
      conversationCreationMode,
      loading,
    });

    navigation.setOptions({
      headerLeft: () =>
        Platform.OS === "ios" ? (
          <Button icon="chevron.left" variant="text" onPress={handleBack} />
        ) : (
          <AndroidBackAction navigation={navigation as any} />
        ),
      headerBackButtonDisplayMode: "default",
      headerTitle: "New chat",
      headerRight: () => {
        return (
          <Text
            text={
              conversationCreationMode === ConversationVersion.DM
                ? "New convo"
                : "New group"
            }
            // onPress={handleRightAction}
          />
        );
      },
    });
  }, [
    pendingChatMembersCount,
    conversationCreationMode,
    loading,
    navigation,
    handleBack,
    themed,
    theme.spacing,
  ]);

  const [
    searchQueryState,
    /*weird name becuase I'm not exactly sure what the ref below does so being expliti as state vs ref*/ setSearchQueryState,
  ] = useState("");
  const searchQueryRef = useRef("");
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    inviteToConverse: "",
    profileSearchResults: {} as { [address: string]: IProfileSocials },
  });

  // todo: abstract debounce and provide option for eager vs lazy debounce
  // ie: lets perform the query but not necessarily rerender until the debounce
  // this will feel snappier
  const debounceDelay = 500;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Log initial effect trigger
    logger.info("[NewConversation] Search effect triggered", {
      searchQueryState,
    });

    if (searchQueryState.length < 3) {
      logger.info(
        "[NewConversation] Search searchQueryState too short, resetting state",
        {
          searchQueryState,
        }
      );
      setStatus({
        loading: false,
        error: "",
        inviteToConverse: "",
        profileSearchResults: {},
      });
      return;
    }

    // Log debounce timer clear
    if (debounceTimer.current !== null) {
      logger.info("[NewConversation] Clearing existing debounce timer");
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const searchForValue = async () => {
        logger.info("[NewConversation] Starting search after debounce", {
          searchQueryState,
        });
        setStatus(({ loading }) => ({
          loading,
          error: "",
          inviteToConverse: "",
          profileSearchResults: {},
        }));

        if (isSupportedPeer(searchQueryState)) {
          logger.info("[NewConversation] Searching for supported peer", {
            searchQueryState,
          });
          setStatus(({ error }) => ({
            loading: true,
            error,
            inviteToConverse: "",
            profileSearchResults: {},
          }));
          searchQueryRef.current = searchQueryState;
          const resolvedAddress = await getAddressForPeer(searchQueryState);
          if (searchQueryRef.current === searchQueryState) {
            // If we're still searching for this one
            if (!resolvedAddress) {
              setStatus({
                loading: false,
                profileSearchResults: {},
                inviteToConverse: "",
                error: "No address has been set for this domain.",
              });

              return;
            }
            const address = getCleanAddress(resolvedAddress);
            logger.info("[NewConversation] Checking if address is on XMTP", {
              address,
            });
            const addressIsOnXmtp = await canMessageByAccount({
              account: currentAccount(),
              peer: address,
            });
            if (searchQueryRef.current === searchQueryState) {
              if (addressIsOnXmtp) {
                logger.info(
                  "[NewConversation] Address found on XMTP, searching profiles",
                  {
                    address,
                    searchQueryState,
                  }
                );
                // Let's search with the exact address!
                const profiles = await searchProfiles(
                  address,
                  currentAccount()
                );

                if (!isEmptyObject(profiles)) {
                  logger.info("[NewConversation] Found and saving profiles", {
                    profileCount: Object.keys(profiles).length,
                  });
                  // Let's save the profiles for future use
                  setProfileRecordSocialsQueryData(profiles);
                  // delete pending chat memebers from search results
                  pendingChatMembers.members.forEach((member) => {
                    delete profiles[member.address];
                  });
                  setStatus({
                    loading: false,
                    error: "",
                    inviteToConverse: "",
                    profileSearchResults: profiles,
                  });
                } else {
                  logger.info(
                    "[NewConversation] No profiles found for XMTP user"
                  );
                  setStatus({
                    loading: false,
                    error: "",
                    inviteToConverse: "",
                    profileSearchResults: {},
                  });
                }
              } else {
                logger.info("[NewConversation] Address not on XMTP", {
                  searchQueryState,
                  address,
                });
                setStatus({
                  loading: false,
                  error: `${shortAddress(
                    searchQueryState
                  )} is not on the XMTP network yet`,
                  inviteToConverse: searchQueryState,
                  profileSearchResults: {},
                });
              }
            }
          }
        } else {
          logger.info(
            "[NewConversation] Searching profiles for non-peer searchQueryState",
            { searchQueryState }
          );
          setStatus({
            loading: true,
            error: "",
            inviteToConverse: "",
            profileSearchResults: {},
          });

          const profiles = await searchProfiles(
            searchQueryState,
            currentAccount()
          );

          if (!isEmptyObject(profiles)) {
            logger.info("[NewConversation] Found and saving profiles", {
              searchQueryState,
              profileCount: Object.keys(profiles).length,
            });
            // Let's save the profiles for future use
            setProfileRecordSocialsQueryData(profiles);
            setStatus({
              loading: false,
              error: "",
              inviteToConverse: "",
              profileSearchResults: profiles,
            });
          } else {
            logger.info("[NewConversation] No profiles found", {
              searchQueryState,
            });
            setStatus({
              loading: false,
              error: "",
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
        logger.info("[NewConversation] Cleanup: clearing debounce timer");
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQueryState, pendingChatMembers.members]);

  const inputRef = useRef<TextInput | null>(null);
  const initialFocus = useRef(false);

  const onRef = useCallback(
    (r: TextInput | null) => {
      if (!initialFocus.current) {
        initialFocus.current = true;
        if (!searchQueryState) {
          logger.debug("[NewConversation] Auto-focusing input");
          setTimeout(() => {
            r?.focus();
          }, 100);
        }
      }
      inputRef.current = r;
    },
    [searchQueryState]
  );

  const shouldDisplaySearchResults =
    !status.loading &&
    !status.error &&
    !isEmptyObject(status.profileSearchResults);

  const shouldDisplayLoading =
    status.loading &&
    !status.error &&
    !isEmptyObject(status.profileSearchResults);

  const shouldDisplayPendingMembers = pendingChatMembers.members.length > 0;

  const shouldDisplayErrorMessage =
    status.error && isEmptyObject(status.profileSearchResults);

  return (
    <View style={themed(stylesNewChat.$searchContainer)}>
      <SearchBar
        value={searchQueryState}
        setValue={setSearchQueryState}
        onRef={onRef}
        inputPlaceholder={"Name, address or onchain ID"}
      />

      {shouldDisplayPendingMembers && (
        <View
          style={[
            themed(stylesNewChat.$pendingChatMembers),
            {
              display: "flex",
            },
          ]}
        >
          {pendingChatMembers.members.map((m) => {
            const preferredName = getPreferredName(m, m.address);

            return (
              <Chip
                key={m.address}
                text={preferredName}
                avatarUrl={getPreferredAvatar(m)}
                onPress={() => {
                  setPendingGroupMembers((g) => ({
                    ...g,
                    members: g.members.filter(
                      (member) => member.address !== m.address
                    ),
                  }));
                }}
              />
            );
          })}
        </View>
      )}

      <View style={{ flex: 1 }}>
        {shouldDisplaySearchResults && (
          <ProfileSearchResultsList
            profiles={(() => {
              const searchResultsToShow = { ...status.profileSearchResults };
              if (pendingChatMembers.members) {
                pendingChatMembers.members.forEach((member) => {
                  delete searchResultsToShow[member.address];
                });
              }
              return searchResultsToShow;
            })()}
            handleSearchResultItemPress={(args) => {
              logger.info("[NewConversation] handleSearchResultItemPress", {
                args,
              });
              setPendingGroupMembers((g) => ({
                ...g,
                members: [
                  ...g.members,
                  { ...args.socials, address: args.address },
                ],
              }));
              setSearchQueryState("");
            }}
          />
        )}
      </View>

      {shouldDisplayErrorMessage && (
        <ScrollView
          style={[themed(stylesNewChat.$modal), { flex: 1 }]}
          keyboardShouldPersistTaps="handled"
          onTouchStart={() => {
            inputRef.current?.blur();
          }}
        >
          {status.error && isEmptyObject(status.profileSearchResults) && (
            <View style={themed(stylesNewChat.$messageContainer)}>
              <Text
                style={[
                  themed(stylesNewChat.$message),
                  themed(stylesNewChat.$error),
                ]}
              >
                {status.error}
              </Text>
            </View>
          )}

          {shouldDisplayLoading && (
            <Loader style={{ marginTop: theme.spacing.lg }} />
          )}
        </ScrollView>
      )}

      {/* todo: review this pattern with Thierry */}
      <ConversationComposerStoreProvider
        storeName={"new-conversation" as ConversationTopic}
      >
        <ConversationComposerContainer>
          <Composer
            hideAddAttachmentButton
            disabled={composerSendButtonDisabled}
            onSend={async (something) => {
              const dmCreationMessageText = something.content.text || "";
              if (
                !dmCreationMessageText ||
                dmCreationMessageText.length === 0
              ) {
                return;
              }
              logger.info(
                "[NewConversation] Sending message",
                something.content.text
              );

              if (conversationCreationMode === ConversationVersion.DM) {
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
                    content: { text: dmCreationMessageText },
                  },
                });
                setConversationQueryData({
                  account: currentAccount(),
                  topic: dm.topic,
                  conversation: dm,
                  context: "NewConversation#sendDm",
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
                    content: { text: dmCreationMessageText },
                  },
                });
                setConversationQueryData({
                  account: currentAccount(),
                  topic: group.topic,
                  conversation: group,
                  context: "NewConversation#sendGroupMessage",
                });
                navigation.replace("Conversation", { topic: group.topic });
              }
            }}
          />
        </ConversationComposerContainer>
      </ConversationComposerStoreProvider>
      <ConversationKeyboardFiller
        messageContextMenuIsOpen={false}
        enabled={true}
      />
    </View>
  );
}

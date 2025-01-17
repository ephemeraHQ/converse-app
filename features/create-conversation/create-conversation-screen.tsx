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
import { Platform, TextInput, View } from "react-native";
import { Button } from "@/design-system/Button/Button";
import { Chip } from "@/design-system/chip";
import { Loader } from "@/design-system/loader";
import { accountCanMessagePeer } from "@/features/consent/account-can-message-peer";
import { ConversationComposer } from "@/features/conversation/conversation-composer/conversation-composer";
import { ConversationComposerContainer } from "@/features/conversation/conversation-composer/conversation-composer-container";
import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { ConversationKeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";
import { sendMessage } from "@/features/conversation/hooks/use-send-message";
import { IProfileSocials } from "@/features/profiles/profile-types";
import { ProfileSearchResultsList } from "@/features/search/components/ProfileSearchResultsList";
import { setConversationQueryData } from "@/queries/useConversationQuery";
import { setProfileRecordSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { useAppTheme } from "@/theme/useAppTheme";
import { searchProfiles } from "@/utils/api/profiles";
import { captureErrorWithToast } from "@/utils/capture-error";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import logger from "@/utils/logger";
import { shortAddress } from "@/utils/strings/shortAddress";
import {
  createConversationByAccount,
  createGroupWithDefaultsByAccount,
  getOptionalConversationByPeerByAccount,
} from "@/utils/xmtpRN/conversations";
import AndroidBackAction from "@components/AndroidBackAction";
import { currentAccount, getCurrentAccount } from "@data/store/accountsStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SearchBar } from "@search/components/SearchBar";
import { getAddressForPeer, isSupportedPeer } from "@utils/evm/address";
import { isEmptyObject } from "@utils/objects";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { ConversationTopic, ConversationVersion } from "@xmtp/react-native-sdk";
import { stylesNewChat } from "./create-conversation.styles";
import { useHeader } from "@/navigation/use-header";

/**
 * Screen shown for when user wants to create a new Chat.
 *
 * User can search for peers, create a new group, create a dm,
 * or navigate to an existing dm.
 */
type NavigationProps = NativeStackNavigationProp<
  NavigationParamList,
  "CreateConversation"
>;

export function CreateConversationScreen({
  navigation,
}: {
  navigation: NavigationProps;
}) {
  const { theme, themed } = useAppTheme();
  const [conversationCreationMode, setConversationCreationMode] =
    useState<ConversationVersion>(ConversationVersion.DM);

  const [
    searchQueryState,
    /*weird name becuase I'm not exactly sure what the ref below does so being expliti as state vs ref*/ setSearchQueryState,
  ] = useState("");
  const searchQueryRef = useRef("");
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    inviteToConverse: "",
    profileSearchResults: {} as { [address: string]: IProfileSocials },
  });

  const [pendingChatMembers, setPendingGroupMembers] = useState({
    members: [] as (IProfileSocials & { address: string })[],
  });
  const pendingChatMembersCount = pendingChatMembers.members.length;
  const composerSendButtonDisabled = pendingChatMembersCount === 0;

  const shouldDisplaySearchResults =
    !status.loading &&
    !status.message &&
    !isEmptyObject(status.profileSearchResults);

  const shouldDisplayLoading =
    status.loading &&
    !status.message &&
    isEmptyObject(status.profileSearchResults);

  const shouldDisplayPendingMembers = pendingChatMembers.members.length > 0;

  const shouldDisplayMessage =
    !!status.message && isEmptyObject(status.profileSearchResults);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (pendingChatMembersCount > 1) {
      setConversationCreationMode(ConversationVersion.GROUP);
    } else if (pendingChatMembersCount === 1) {
      setConversationCreationMode(ConversationVersion.DM);
    }
  }, [pendingChatMembersCount]);

  useHeader({
    title: "New chat",
    safeAreaEdges: ["top"],
    onBack: handleBack,
  });

  // todo: abstract debounce and provide option for eager vs lazy debounce
  // ie: lets perform the query but not necessarily rerender until the debounce
  // this will feel snappier
  const debounceDelay = 200;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Log initial effect trigger
    logger.info("[CreateConversation] Search effect triggered", {
      searchQueryState,
    });
    if (searchQueryState.length === 0) {
      setStatus({
        loading: false,
        message: "",
        inviteToConverse: "",
        profileSearchResults: {},
      });
      return;
    }

    // Log debounce timer clear
    if (debounceTimer.current !== null) {
      logger.info("[CreateConversation] Clearing existing debounce timer");
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const searchForValue = async () => {
        logger.info("[CreateConversation] Starting search after debounce", {
          searchQueryState,
        });
        setStatus(({ loading }) => ({
          loading,
          message: "",
          inviteToConverse: "",
          profileSearchResults: {},
        }));

        if (isSupportedPeer(searchQueryState)) {
          logger.info("[CreateConversation] Searching for supported peer", {
            searchQueryState,
          });
          setStatus(({ message }) => ({
            loading: true,
            message,
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
            if (searchQueryRef.current === searchQueryState) {
              if (addressIsOnXmtp) {
                logger.info(
                  "[CreateConversation] Address found on XMTP, searching profiles",
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
                  logger.info(
                    "[CreateConversation] Found and saving profiles",
                    {
                      profileCount: Object.keys(profiles).length,
                    }
                  );
                  // Let's save the profiles for future use
                  setProfileRecordSocialsQueryData(profiles);
                  // delete pending chat memebers from search results
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
                  searchQueryState,
                  address,
                });
                setStatus({
                  loading: false,
                  message: `${shortAddress(
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
            "[CreateConversation] Searching profiles for non-peer searchQueryState",
            { searchQueryState }
          );
          setStatus({
            loading: true,
            message: "",
            inviteToConverse: "",
            profileSearchResults: {},
          });

          const profiles = await searchProfiles(
            searchQueryState,
            currentAccount()
          );

          if (!isEmptyObject(profiles)) {
            logger.info("[CreateConversation] Found and saving profiles", {
              searchQueryState,
              profileCount: Object.keys(profiles).length,
            });
            // Let's save the profiles for future use[getCurrentAccount()!]
            logger.info(
              "[CreateConversation] Current account",
              getCurrentAccount()
            );
            logger.info("[CreateConversation] Saving profiles", profiles);
            setProfileRecordSocialsQueryData(profiles);
            const currentAccountInProfiles =
              profiles[getCurrentAccount()!.toLowerCase()];
            logger.info(
              "[CreateConversation] Current account in profiles",
              /** whjy the hell is this undefined if i search for myself in prifiles above? */
              currentAccountInProfiles
            );
            if (currentAccountInProfiles) {
              logger.info(
                "[CreateConversation] Deleting current account from profiles",
                getCurrentAccount()
              );
              delete profiles[getCurrentAccount()!.toLowerCase()];
            }

            setStatus({
              loading: false,
              message: "",
              inviteToConverse: "",
              profileSearchResults: profiles,
            });
          } else {
            logger.info("[CreateConversation] No profiles found", {
              searchQueryState,
            });
            setStatus({
              loading: false,
              message: `No profiles found for ${searchQueryState}`,
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
  }, [searchQueryState, pendingChatMembers.members]);

  const inputRef = useRef<TextInput | null>(null);
  const initialFocus = useRef(false);

  const onRef = useCallback(
    (r: TextInput | null) => {
      if (!initialFocus.current) {
        initialFocus.current = true;
        if (!searchQueryState) {
          logger.debug("[CreateConversation] Auto-focusing input");
          setTimeout(() => {
            r?.focus();
          }, 100);
        }
      }
      inputRef.current = r;
    },
    [searchQueryState]
  );

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
      {shouldDisplaySearchResults && (
        <View style={{ flex: 1 }}>
          <ProfileSearchResultsList
            profiles={(() => {
              // todo: filter this from search, not here
              const searchResultsToShow = { ...status.profileSearchResults };
              if (pendingChatMembers.members) {
                pendingChatMembers.members.forEach((member) => {
                  delete searchResultsToShow[member.address];
                });
              }
              if (
                pendingChatMembers.members.find(
                  (member) => member.address === getCurrentAccount()!
                )
              ) {
                delete searchResultsToShow[getCurrentAccount()!];
              }
              return searchResultsToShow;
            })()}
            handleSearchResultItemPress={(args) => {
              logger.info("[CreateConversation] handleSearchResultItemPress", {
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
        </View>
      )}
      {shouldDisplayMessage && (
        <View style={themed(stylesNewChat.$messageContainer)}>
          <Text
            style={[
              themed(stylesNewChat.$message),
              themed(stylesNewChat.$error),
            ]}
          >
            {status.message}
          </Text>
        </View>
      )}
      {shouldDisplayLoading && (
        <View style={{ flex: 1 }}>
          <Loader size="large" style={{ marginTop: theme.spacing.lg }} />
        </View>
      )}

      {/* spacer if not doing anything */}
      <View style={{ flex: 1 }} />

      {/* todo: review this pattern with Thierry */}
      <ConversationComposerStoreProvider
        storeName={"new-conversation" as ConversationTopic}
      >
        <ConversationComposerContainer>
          <ConversationComposer
            hideAddAttachmentButton
            disabled={composerSendButtonDisabled || status.loading}
            // todo clean this up/use hooks or query functions properly
            onSend={async (something) => {
              try {
                const dmCreationMessageText = something.content.text || "";
                if (
                  !dmCreationMessageText ||
                  dmCreationMessageText.length === 0
                ) {
                  return;
                }
                logger.info(
                  "[CreateConversation] Sending message",
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
                  });
                  navigation.replace("Conversation", { topic: group.topic });
                }
              } catch (e) {
                const errorString =
                  (e as Error)?.message || `Something went wrong`;
                captureErrorWithToast(e);
                setStatus({
                  loading: false,
                  message: errorString,
                  inviteToConverse: "",
                  profileSearchResults: {},
                });
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

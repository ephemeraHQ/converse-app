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
 * UI:
 *
 * search results list needs updating
 * create chips for search results
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
import { getPreferredName } from "@utils/profile";
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

/**
 * Screen shown for when user wants to create a new Chat.
 *
 * User can search for peers, create a new group, create a dm,
 * or navigate to an existing dm.
 */
export default function NewConversation({}) {
  const { theme, themed } = useAppTheme();
  const [conversationCreationMode, setConversationCreationMode] =
    useState<ConversationVersion>(ConversationVersion.DM);
  const navigation = useNavigation();

  const handleBack = useCallback(() => {
    logger.debug("[NewConversation] Navigating back");
    navigation.goBack();
  }, [navigation]);

  const [pendingChatMembers, setPendingGroupMembers] = useState({
    members: [] as (IProfileSocials & { address: string })[],
  });

  useEffect(() => {
    console.log("pendingChatMembers", pendingChatMembers.members);
    if (pendingChatMembers.members.length > 1) {
      setConversationCreationMode(ConversationVersion.GROUP);
    } else if (pendingChatMembers.members.length === 1) {
      setConversationCreationMode(ConversationVersion.DM);
    }
  }, [pendingChatMembers.members.length]);

  const [loading, setLoading] = useState(false);

  const handleRightAction = useCallback(async () => {
    logger.debug("[NewConversation] Handling right action", {
      memberCount: pendingChatMembers.members.length,
    });

    logger.debug("[NewConversation] Conversation creation mode", {
      conversationCreationMode,
    });
    logger.debug("[NewConversation] Group", {
      pendingChatMembers: JSON.stringify(pendingChatMembers, null, 2),
    });
    logger.debug(
      "header right action shouldnt be used we should do the creation logic in response to a message being 'sent'"
    );
  }, [pendingChatMembers.members, navigation]);

  useEffect(() => {
    logger.debug("[NewConversation] Setting navigation options", {
      memberCount: pendingChatMembers.members.length,
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
          <Button
            variant="text"
            text={
              conversationCreationMode === ConversationVersion.DM
                ? "New convo"
                : "New group"
            }
            onPress={handleRightAction}
          />
        );
      },
    });
  }, [
    pendingChatMembers,
    conversationCreationMode,
    loading,
    navigation,
    handleBack,
    handleRightAction,
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
                  setProfileRecordSocialsQueryData(currentAccount(), profiles);
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
                  error: `${shortAddress(searchQueryState)} is not on the XMTP network yet`,
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
            setProfileRecordSocialsQueryData(currentAccount(), profiles);
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
  }, [searchQueryState]);

  const inputRef = useRef<TextInput | null>(null);
  const initialFocus = useRef(false);

  // const inputPlaceholder = ".converse.xyz, 0x, .eth, .lens, .fc, .cb.id, UD…";

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
        inputPlaceholder={".converse.xyz, 0x, .eth, .lens, .fc, .cb.id, UD…"}
      />
      <View
        style={[
          themed(stylesNewChat.$pendingChatMembers),
          {
            display: shouldDisplayPendingMembers ? "flex" : "none",
          },
        ]}
      >
        {shouldDisplayPendingMembers &&
          pendingChatMembers.members.map((m, index) => {
            const preferredName = getPreferredName(m, m.address);

            return (
              <Button /** remove member from pendingChatMembers */
                key={m.address}
                text={preferredName}
                variant="fill"
                size="md"
                picto="xmark"
                style={themed(stylesNewChat.$groupMemberButton)}
                onPress={() =>
                  setPendingGroupMembers((g) => {
                    const members = [...g.members];
                    members.splice(index, 1);
                    return {
                      ...g,
                      members,
                    };
                  })
                }
              />
            );
          })}
      </View>

      {shouldDisplaySearchResults && (
        <View style={{ flex: 1 }}>
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
        </View>
      )}

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

          {/* {!status.loading && !!status.inviteToConverse && (
            <TableView
              items={[
                {
                  id: "inviteToConverse",
                  leftView: <TableViewPicto symbol="link" />,
                  title: translate("new_chat.invite_to_converse"),
                  subtitle: "",
                  action: () => {
                    navigation.goBack();
                    navigate("ShareProfile");
                  },
                },
              ]}
              style={themed($tableView)}
            />
          )} */}
        </ScrollView>
      )}
      {/* todo: remove this pattenr with Thierry */}
      <ConversationComposerStoreProvider
        storeName={"new-conversation" as ConversationTopic}
        inputValue={"testing"}
      >
        <ConversationComposerContainer>
          <Composer
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
                // @ts-expect-error
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
                // @ts-expect-error
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

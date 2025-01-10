import { Button } from "@design-system/Button/Button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  TextInput,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";

import { translate } from "@/i18n";
import { getCleanAddress } from "@/utils/evm/getCleanAddress";
import { useGroupQuery } from "@queries/useGroupQuery";
import SearchBar from "@search/components/SearchBar";
import { canMessageByAccount } from "@utils/xmtpRN/contacts";
import {
  ConversationTopic,
  ConversationVersion,
  InboxId,
} from "@xmtp/react-native-sdk";
import AndroidBackAction from "@components/AndroidBackAction";
import Recommendations from "@components/Recommendations/Recommendations";
import TableView from "@components/TableView/TableView";
import { TableViewPicto } from "@components/TableView/TableViewImage";
import config from "@config";
import {
  currentAccount,
  useRecommendationsStore,
} from "@data/store/accountsStore";
import { IProfileSocials } from "@/features/profiles/profile-types";
import { useSelect } from "@data/store/storeHelpers";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { searchProfiles } from "@utils/api";
import { getAddressForPeer, isSupportedPeer } from "@utils/evm/address";
import { navigate } from "@utils/navigation";
import { isEmptyObject } from "@utils/objects";
import { getPreferredName } from "@utils/profile";
import { NewConversationModalParams } from "./NewConversationModal";
import { setProfileRecordSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { Text } from "@design-system/Text";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Loader } from "@/design-system/loader";
import { textSizeStyles } from "@/design-system/Text/Text.styles";
import logger from "@/utils/logger";
import { ProfileSearchResultsList } from "@/features/search/components/ProfileSearchResultsList";
import { Conversation } from "@/features/conversation/conversation";
import { Composer } from "@/features/conversation/conversation-composer/conversation-composer";
import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { ConversationComposerContainer } from "@/features/conversation/conversation-composer/conversation-composer-container";
import { ConversationKeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";

export default function NewConversation({
  route,
  navigation,
}: NativeStackScreenProps<
  NewConversationModalParams,
  "NewChatComposerScreen"
>) {
  const handleBack = useCallback(() => {
    logger.debug("[NewConversation] Navigating back");
    navigation.goBack();
  }, [navigation]);

  const { theme, themed } = useAppTheme();

  // const { data: existingGroup } = useGroupQuery({
  //   account: currentAccount(),
  //   topic: route.params?.addingToGroupTopic!,
  // });

  const [group, setGroup] = useState({
    enabled: !!route.params?.addingToGroupTopic,
    members: [] as (IProfileSocials & { address: string })[],
  });

  const { addMembers, members } = useGroupMembers(
    route.params?.addingToGroupTopic!
  );

  const [loading, setLoading] = useState(false);

  const handleRightAction = useCallback(async () => {
    logger.debug("[NewConversation] Handling right action", {
      isAddingToGroup: !!route.params?.addingToGroupTopic,
      memberCount: group.members.length,
    });

    if (route.params?.addingToGroupTopic) {
      setLoading(true);
      try {
        //  TODO: Support multiple addresses
        await addMembers(group.members.map((m) => m.address));
        logger.debug("[NewConversation] Successfully added members to group", {
          memberAddresses: group.members.map((m) => m.address),
        });
        navigation.goBack();
      } catch (e) {
        setLoading(false);
        logger.error("[NewConversation] Failed to add members to group", e);
        Alert.alert("An error occured");
      }
    } else {
      logger.debug("[NewConversation] Navigating to NewGroupSummary", {
        memberCount: group.members.length,
      });
      navigation.push("NewGroupSummary", {
        members: group.members,
      });
    }
  }, [addMembers, group.members, navigation, route.params?.addingToGroupTopic]);

  const conversationCreationMode = ConversationVersion.DM;

  useEffect(() => {
    logger.debug("[NewConversation] Setting navigation options", {
      groupEnabled: group.enabled,
      memberCount: group.members.length,
      loading,
    });

    navigation.setOptions({
      headerLeft: () =>
        Platform.OS === "ios" ? (
          <Button icon="chevron.left" variant="text" onPress={handleBack} />
        ) : (
          <AndroidBackAction navigation={navigation} />
        ),
      headerBackButtonDisplayMode: "default",
      headerTitle: group.enabled
        ? route.params?.addingToGroupTopic
          ? translate("new_chat.add_members")
          : translate("new_chat.create_group")
        : translate("new_chat.new_chat"),
      headerRight: () => {
        return (
          <Button
            variant="text"
            text={
              conversationCreationMode === ConversationVersion.DM
                ? "New dm"
                : "New group"
            }
            onPress={handleRightAction}
          />
        );
      },
      // headerRight: () => {
      //   if (group.enabled && group.members.length > 0) {
      //     if (loading) {
      //       return <Loader style={{ marginRight: theme.spacing["5xs"] }} />;
      //     } else {
      //       return (
      //         <Button
      //           variant="text"
      //           text={route.params?.addingToGroupTopic ? "Add" : "Next"}
      //           onPress={handleRightAction}
      //           style={{ marginRight: -10, padding: 10 }}
      //         />
      //       );
      //     }
      //   }
      //   return undefined;
      // },
    });
  }, [
    group,
    loading,
    navigation,
    route.params?.addingToGroupTopic,
    addMembers,
    handleBack,
    handleRightAction,
    themed,
    theme.spacing,
  ]);

  const [value, setValue] = useState(route.params?.peer || "");
  const searchingForValue = useRef("");
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    inviteToConverse: "",
    profileSearchResults: {} as { [address: string]: IProfileSocials },
  });

  const {
    updatedAt: recommendationsUpdatedAt,
    loading: recommendationsLoading,
    frens,
  } = useRecommendationsStore(useSelect(["updatedAt", "loading", "frens"]));
  const recommendationsLoadedOnce = recommendationsUpdatedAt > 0;
  const recommendationsFrensCount = Object.keys(frens).length;

  const debounceDelay = 500;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Log initial effect trigger
    logger.info("[NewConversation] Search effect triggered", { value });

    if (value.length < 3) {
      logger.info("[NewConversation] Search value too short, resetting state", {
        value,
      });
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
          value,
        });
        setStatus(({ loading }) => ({
          loading,
          error: "",
          inviteToConverse: "",
          profileSearchResults: {},
        }));

        if (isSupportedPeer(value)) {
          logger.info("[NewConversation] Searching for supported peer", {
            value,
          });
          setStatus(({ error }) => ({
            loading: true,
            error,
            inviteToConverse: "",
            profileSearchResults: {},
          }));
          searchingForValue.current = value;
          const resolvedAddress = await getAddressForPeer(value);
          if (searchingForValue.current === value) {
            // If we're still searching for this one
            if (!resolvedAddress) {
              const isLens = value.endsWith(config.lensSuffix);
              const isFarcaster = value.endsWith(".fc");
              logger.info("[NewConversation] No address resolved for peer", {
                value,
                isLens,
                isFarcaster,
              });
              setStatus({
                loading: false,
                profileSearchResults: {},
                inviteToConverse: "",
                error:
                  isLens || isFarcaster
                    ? "This handle does not exist. Please try again."
                    : "No address has been set for this domain.",
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
            if (searchingForValue.current === value) {
              if (addressIsOnXmtp) {
                logger.info(
                  "[NewConversation] Address found on XMTP, searching profiles",
                  {
                    address,
                    value,
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
                  value,
                  address,
                });
                setStatus({
                  loading: false,
                  error: `${value} does not use Converse or XMTP yet`,
                  inviteToConverse: value,
                  profileSearchResults: {},
                });
              }
            }
          }
        } else {
          logger.info(
            "[NewConversation] Searching profiles for non-peer value",
            { value }
          );
          setStatus({
            loading: true,
            error: "",
            inviteToConverse: "",
            profileSearchResults: {},
          });

          const profiles = await searchProfiles(value, currentAccount());

          if (!isEmptyObject(profiles)) {
            logger.info("[NewConversation] Found and saving profiles", {
              value,
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
            logger.info("[NewConversation] No profiles found", { value });
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
  }, [value]);

  const inputRef = useRef<TextInput | null>(null);
  const initialFocus = useRef(false);

  const showRecommendations =
    !status.loading && value.length === 0 && recommendationsFrensCount > 0;

  const inputPlaceholder = ".converse.xyz, 0x, .eth, .lens, .fc, .cb.id, UD…";

  const onRef = useCallback(
    (r: TextInput | null) => {
      if (!initialFocus.current) {
        initialFocus.current = true;
        if (
          !value &&
          !recommendationsLoading &&
          recommendationsLoadedOnce &&
          recommendationsFrensCount === 0
        ) {
          logger.debug("[NewConversation] Auto-focusing input");
          setTimeout(() => {
            r?.focus();
          }, 100);
        }
      }
      inputRef.current = r;
    },
    [
      recommendationsFrensCount,
      recommendationsLoadedOnce,
      recommendationsLoading,
      value,
    ]
  );

  return (
    <View style={themed($searchContainer)}>
      <SearchBar
        value={value}
        setValue={setValue}
        onRef={onRef}
        inputPlaceholder={inputPlaceholder}
      />
      <View
        style={[
          themed($group),
          {
            display:
              group.enabled && group.members.length === 0 ? "none" : "flex",
          },
        ]}
      >
        {/* {!group.enabled && (
          <Button
            variant="text"
            picto="person.2"
            text={translate("new_group.title")}
            style={themed($newGroupButton)}
            onPress={() => {
              setGroup({ enabled: true, members: [] });
            }}
          />
        )} */}

        {group.enabled &&
          group.members.length > 0 &&
          group.members.map((m, index) => {
            const preferredName = getPreferredName(m, m.address);

            return (
              <Button
                key={m.address}
                text={preferredName}
                variant="fill"
                size="md"
                picto="xmark"
                style={themed($groupMemberButton)}
                onPress={() =>
                  setGroup((g) => {
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

      {!status.loading && !isEmptyObject(status.profileSearchResults) ? (
        <View style={{ flex: 1 }}>
          <ProfileSearchResultsList
            navigation={navigation}
            profiles={(() => {
              const searchResultsToShow = { ...status.profileSearchResults };
              if (group.enabled && group.members) {
                group.members.forEach((member) => {
                  delete searchResultsToShow[member.address];
                });
              }
              if (members) {
                members?.ids?.forEach((memberId: InboxId) => {
                  const member = members.byId[memberId];
                  const address = getCleanAddress(member.addresses[0]);
                  delete searchResultsToShow[address];
                });
              }
              return searchResultsToShow;
            })()}
            groupMode={group.enabled}
            addToGroup={async (member) => {
              setGroup((g) => ({ ...g, members: [...g.members, member] }));
              setValue("");
            }}
          />
        </View>
      ) : (
        <ScrollView
          style={[themed($modal), { flex: 1 }]}
          keyboardShouldPersistTaps="handled"
          onTouchStart={() => {
            inputRef.current?.blur();
          }}
        >
          {isEmptyObject(status.profileSearchResults) && (
            <View
              style={{
                backgroundColor: theme.colors.background.surface,
                height: showRecommendations ? undefined : 0,
              }}
            >
              <Recommendations
                visibility="EMBEDDED"
                groupMode={group.enabled}
                groupMembers={group.members}
                addToGroup={async (member) => {
                  setGroup((g) => ({ ...g, members: [...g.members, member] }));
                  setValue("");
                }}
              />
            </View>
          )}

          {!status.loading && isEmptyObject(status.profileSearchResults) && (
            <View style={themed($messageContainer)}>
              {status.error ? (
                <Text style={[themed($message), themed($error)]}>
                  {status.error}
                </Text>
              ) : (
                <Text style={themed($message)}>
                  <Text>
                    Type the full address/domain of your contact (with
                    .converse.xyz, .eth, .lens, .fc, .cb.id…)
                  </Text>
                </Text>
              )}
            </View>
          )}

          {status.loading && <Loader style={{ marginTop: theme.spacing.lg }} />}

          {!status.loading && !!status.inviteToConverse && (
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
          )}
        </ScrollView>
      )}
      {/* todo: confirm with thierry we like this pattern  */}
      <ConversationComposerStoreProvider
        storeName={"new-conversation" as ConversationTopic}
        inputValue={"testing"}
      >
        <ConversationComposerContainer>
          <Composer
            onSend={async (something) => {
              logger.info(
                "[NewConversation] Sending message",
                something.content.text
              );
              // todo:
              // create group/dm
              // add member to group
              // send message
              // createGroupWithFirstMessage({
              //   account: currentAccount(),
              //   members: [draftMembersToAdd],
              //   message: something.content.text,
              // });
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

const $modal: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background.surface,
});

const $messageContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  ...Platform.select({
    default: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    android: {
      marginRight: spacing.md,
      marginLeft: spacing.md,
      marginTop: spacing.md,
    },
  }),
});

const $message: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
  ...textSizeStyles.sm,
  ...Platform.select({
    default: {
      textAlign: "center",
    },
  }),
});

const $error: ThemedStyle<TextStyle> = ({ colors }) => ({
  color:
    Platform.OS === "android" ? colors.text.secondary : colors.text.primary,
});

const $tableView: ThemedStyle<ViewStyle> = () => ({
  marginHorizontal: Platform.OS === "android" ? 0 : 18,
});

const $group: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  minHeight: 50,
  paddingBottom: Platform.OS === "ios" ? spacing.xs : 0,
  flexDirection: "row",
  alignItems: "center",
  paddingLeft: Platform.OS === "ios" ? spacing.md : 0,
  justifyContent: "flex-start",
  borderBottomWidth: Platform.OS === "android" ? 1 : 0.5,
  borderBottomColor: colors.border.subtle,
  backgroundColor: colors.background.surface,
  flexWrap: "wrap",
});

const $groupMemberButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: 0,
  marginHorizontal: 0,
  marginRight: spacing.xs,
  marginTop: spacing.xs,
});

const $searchContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background.surface,
});

const $newGroupButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginLeft: spacing["6xs"],
  paddingTop: Platform.OS === "ios" ? spacing.sm : spacing.xs,
  paddingBottom: Platform.OS === "ios" ? 0 : spacing.xs,
});

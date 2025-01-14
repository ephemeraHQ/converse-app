import { Avatar } from "@/components/Avatar";
import { ErroredHeader } from "@/components/ErroredHeader";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import {
  useAccountsList,
  useAccountsStore,
  useChatStore,
  useCurrentAccount,
  useSettingsStore,
} from "@/data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import { Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { Icon, iconRegistry } from "@/design-system/Icon/Icon";
import { Pressable } from "@/design-system/Pressable";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { ConversationListPinnedConversations } from "@/features/conversation-list/PinnedConversations/PinnedConversations";
import { V3DMListItem } from "@/features/conversation-list/components/conversation-list-item/V3DMListItem";
import { V3GroupConversationListItem } from "@/features/conversation-list/components/conversation-list-item/V3GroupConversationListItem";
import { ConversationListItem } from "@/features/conversation-list/components/conversation-list-item/conversation-list-item";
import { ConversationListAvatarSkeleton } from "@/features/conversation-list/components/conversation-list-item/conversation-list-item-avatar-skeleton";
import { ConversationList } from "@/features/conversation-list/components/conversation-list/conversation-list";
import { useConversationListStyles } from "@/features/conversation-list/conversation-list.styles";
import { useConversationContextMenuViewDefaultProps } from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-default-props";
import { useShouldShowConnecting } from "@/features/conversation-list/hooks/useShouldShowConnecting";
import { useShouldShowConnectingOrSyncing } from "@/features/conversation-list/hooks/useShouldShowConnectingOrSyncing";
import { useConversationListStoreForCurrentAccount } from "@/features/conversation-list/stores/conversation-list.store";
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { usePreferredName } from "@/hooks/usePreferredName";
import { useShouldShowErrored } from "@/hooks/useShouldShowErrored";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { $globalStyles } from "@/theme/styles";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import { Haptics } from "@/utils/haptics";
import { shortDisplayName } from "@/utils/str";
import { useAccountsProfiles } from "@/utils/useAccountsProfiles";
import {
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/client.types";
import { useDisconnectActionSheet } from "@hooks/useDisconnectActionSheet";
import { useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import {
  ContextMenuButton,
  ContextMenuView,
  MenuActionConfig,
} from "react-native-ios-context-menu";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConversationListRequestCount } from "./useConversationListRequestCount";
import logger from "@/utils/logger";

type IConversationListProps = NativeStackScreenProps<
  NavigationParamList,
  "Chats"
>;

export function ConversationListScreen({
  navigation,
  route,
}: IConversationListProps) {
  // const {
  //   searchQuery,
  //   setSearchBarFocused,
  //   openedConversationTopic,
  //   setSearchQuery,
  // } = useChatStore(
  //   useSelect([
  //     "searchQuery",
  //     "setSearchQuery",
  //     "setSearchBarFocused",
  //     "openedConversationTopic",
  //   ])
  // );

  const {
    data: conversations,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useConversationListItems();

  const insets = useSafeAreaInsets();

  // const [flatListItems, setFlatListItems] = useState<{
  //   items: FlatListItemType[];
  //   searchQuery: string;
  // }>({ items: [], searchQuery: "" });

  // const showNoResult = flatListItems.items.length === 0 && !!searchQuery;

  useHeaderWrapper();

  // useEffect(() => {
  //   const getFilteredItems = async () => {
  //     const filteredItems: FlatListItemType[] = [];
  //     for (const item of items ?? []) {
  //       if (item.version === ConversationVersion.GROUP) {
  //         const groupMatches = await groupMatchesSearchQuery({
  //           account: currentAccount!,
  //           searchQuery,
  //           group: item,
  //         });
  //         if (groupMatches) {
  //           filteredItems.push(item);
  //         }
  //       } else if (item.version === ConversationVersion.DM) {
  //         const dmMatches = await dmMatchesSearchQuery({
  //           account: currentAccount!,
  //           searchQuery,
  //           dm: item,
  //         });
  //         if (dmMatches) {
  //           filteredItems.push(item);
  //         }
  //       }
  //     }
  //     return filteredItems ?? [];
  //   };
  //   if (searchQuery.trim().length > 0) {
  //     getFilteredItems().then((filteredItems) => {
  //       setFlatListItems({ items: filteredItems, searchQuery });
  //     });
  //   } else {
  //     setFlatListItems({ items: items ?? [], searchQuery });
  //   }
  // }, [searchQuery, items, currentAccount]);

  const handleRefresh = useCallback(async () => {
    try {
      await refetchConversations();
    } catch (error) {
      captureError(error);
    }
  }, [refetchConversations]);

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      <ConversationList
        conversations={isLoadingConversations ? [] : (conversations ?? [])}
        scrollEnabled={conversations && conversations?.length > 0}
        ListEmptyComponent={<ConversationListEmpty />}
        ListHeaderComponent={<ListHeader />}
        onRefetch={handleRefresh}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        renderConversation={({ item }) => {
          if (isConversationGroup(item)) {
            return <ConversationListGroup group={item} />;
          }
          return <ConversationListDm dm={item} />;
        }}
      />
      {/* TODO: <Recommendations visibility="HIDDEN" /> */}
    </Screen>
  );
}

const ConversationListEmpty = memo(function ConversationListEmpty() {
  const pinnedConversations = useConversationListStoreForCurrentAccount(
    (s) => s.pinnedConversationTopics
  );

  if (pinnedConversations.length > 0) {
    return null;
  }

  return <ConversationListSkeletons />;
});

export const ConversationListSkeletons = memo(
  function ConversationListSkeletons() {
    const { theme } = useAppTheme();

    return (
      <VStack>
        {/* 8 to fill up the screen */}
        {new Array(8).fill(null).map((_, index) => (
          <ConversationListItem
            key={index}
            avatarComponent={
              <ConversationListAvatarSkeleton
                color={theme.colors.fill.minimal}
                size={theme.avatarSize.lg}
              />
            }
          />
        ))}
      </VStack>
    );
  }
);

const ConversationListDm = memo(function ConversationListDm(props: {
  dm: DmWithCodecsType;
}) {
  const { dm } = props;

  const { theme } = useAppTheme();

  const contextMenuProps = useConversationContextMenuViewDefaultProps({
    conversationTopic: dm.topic,
  });

  return (
    <ContextMenuView hitSlop={theme.spacing.xs} {...contextMenuProps}>
      <V3DMListItem conversation={dm} />
    </ContextMenuView>
  );
});

const ConversationListGroup = memo(function ConversationListGroup(props: {
  group: GroupWithCodecsType;
}) {
  const { group } = props;

  const { theme } = useAppTheme();

  const contextMenuProps = useConversationContextMenuViewDefaultProps({
    conversationTopic: group.topic,
  });

  return (
    <ContextMenuView hitSlop={theme.spacing.xs} {...contextMenuProps}>
      <V3GroupConversationListItem group={group} />
    </ContextMenuView>
  );
});

const ListHeader = React.memo(function ListHeader() {
  const { ephemeralAccount } = useSettingsStore(
    useSelect(["ephemeralAccount"])
  );

  return (
    <VStack style={{}}>
      <States />
      {ephemeralAccount && <EphemeralAccountBanner />}
      <ConversationListPinnedConversations />
      <Requests />
    </VStack>
  );
});

const States = memo(function States() {
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const shouldShowConnecting = useShouldShowConnecting();
  const shouldShowError = useShouldShowErrored();

  // TODO: Not sure about those
  if (shouldShowError) {
    return <ErroredHeader />;
  }

  // TODO: Not sure about those
  if (shouldShowConnectingOrSyncing) {
    return null;
  }

  // TODO: Not sure about those
  if (shouldShowConnecting) {
    return null;
  }

  return null;
});

const Requests = memo(function Requests() {
  const { theme } = useAppTheme();
  const requestsCount = useConversationListRequestCount();
  const navigation = useNavigation();

  if (requestsCount === 0) {
    return null;
  }

  return (
    <ConversationListItem
      title="Requests"
      onPress={() => {
        navigation.navigate("ChatsRequests");
      }}
      subtitle={`${requestsCount} awaiting your response`}
      avatarComponent={
        <Center
          // {...debugBorder()}
          style={{
            width: theme.avatarSize.lg,
            height: theme.avatarSize.lg,
            backgroundColor: theme.colors.fill.primary,
            borderRadius: 999,
          }}
        >
          {/* TODO: Add skia and make it better */}
          <Icon
            icon="shield.fill"
            color={theme.colors.global.green}
            size={theme.iconSize.md}
          />
        </Center>
      }
    />
  );
});

function useHeaderWrapper() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const currentAccount = useCurrentAccount();
  const preferredName = usePreferredName(currentAccount!);
  const accounts = useAccountsList();
  const accountsProfiles = useAccountsProfiles();
  const setCurrentAccount = useAccountsStore((s) => s.setCurrentAccount);

  useHeader(
    {
      safeAreaEdges: ["top"],
      RightActionComponent: (
        <HStack
          style={{
            alignItems: "center",
            columnGap: theme.spacing.xxs,
          }}
        >
          <HeaderAction
            icon="qrcode"
            onPress={() => {
              navigation.navigate("ShareProfile");
            }}
          />
          <HeaderAction
            style={{
              marginBottom: 4, // The square.and.pencil icon is not centered with the qrcode if we don't have this margin
            }}
            icon="square.and.pencil"
            onPress={() => {
              logger.debug(
                "[ConversationListScreen] Navigating to NewConversation"
              );
              navigation.navigate("NewConversation");
            }}
          />
        </HStack>
      ),
      titleComponent: (
        <HStack
          // {...debugBorder()}
          style={{
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => {
              navigation.navigate("Profile", {
                address: currentAccount!,
              });
            }}
            hitSlop={theme.spacing.sm}
          >
            <Center
              style={{
                padding: theme.spacing.xxs,
              }}
            >
              <Avatar size={theme.avatarSize.sm} />
            </Center>
          </Pressable>
          <ContextMenuButton
            // hitSlop={theme.spacing.sm} // Not working...
            style={{
              paddingVertical: theme.spacing.sm, // TMP solution for the hitSlop not working
              paddingRight: theme.spacing.sm, // TMP solution for the hitSlop not working
            }}
            isMenuPrimaryAction
            onPressMenuItem={({ nativeEvent }) => {
              Haptics.selectionAsync();
              if (nativeEvent.actionKey === "all-chats") {
                Alert.alert("Coming soon");
              } else if (nativeEvent.actionKey === "new-account") {
                navigation.navigate("NewAccountNavigator");
              } else if (nativeEvent.actionKey === "app-settings") {
                Alert.alert("Coming soon");
              }
              // Pressed on an account
              else {
                setCurrentAccount(nativeEvent.actionKey, false);
              }
            }}
            menuConfig={{
              menuTitle: "",
              menuItems: [
                ...accountsProfiles.map((profilePreferedName, index) => {
                  return {
                    actionKey: accounts[index],
                    actionTitle: shortDisplayName(profilePreferedName),
                    icon: {
                      iconType: "SYSTEM",
                      iconValue:
                        currentAccount === accounts[index]
                          ? Platform.select({
                              default: "checkmark",
                              ios: "checkmark",
                              android: "checkmark",
                            })
                          : "",
                    },
                  } as MenuActionConfig;
                }),
                {
                  type: "menu",
                  menuTitle: "",
                  menuOptions: ["displayInline"],
                  menuItems: [
                    {
                      actionKey: "new-account",
                      actionTitle: translate("new_account"),
                      icon: {
                        iconType: "SYSTEM",
                        iconValue: iconRegistry["new-account-card"],
                      },
                    },
                  ],
                },
                {
                  type: "menu",
                  menuTitle: "",
                  menuOptions: ["displayInline"],
                  menuItems: [
                    {
                      actionKey: "app-settings",
                      actionTitle: translate("App settings"),
                      icon: {
                        iconType: "SYSTEM",
                        iconValue: iconRegistry["settings"],
                      },
                    },
                  ],
                },
              ],
            }}
          >
            <HStack
              // {...debugBorder()}
              style={{
                alignItems: "center",
                columnGap: theme.spacing.xxxs,
                // paddingVertical: theme.spacing.sm,
              }}
            >
              <Text>{shortDisplayName(preferredName)}</Text>
              <Center
                style={{
                  width: theme.spacing.container.small,
                  height: theme.spacing.container.small,
                }}
              >
                <Icon
                  color={theme.colors.text.secondary}
                  icon="chevron.down"
                  size={theme.iconSize.xs}
                />
              </Center>
            </HStack>
          </ContextMenuButton>
        </HStack>
      ),
    },
    [
      navigation,
      preferredName,
      accounts,
      accountsProfiles,
      currentAccount,
      setCurrentAccount,
      theme,
    ]
  );
}

const EphemeralAccountBanner = React.memo(function EphemeralAccountBanner() {
  const { theme } = useAppTheme();
  const colorScheme = useColorScheme();
  const showDisconnectActionSheet = useDisconnectActionSheet();
  const { screenHorizontalPadding } = useConversationListStyles();

  return (
    <TouchableOpacity
      onPress={() => showDisconnectActionSheet(colorScheme)}
      style={{
        width: "100%",
        backgroundColor: theme.colors.background.blurred,
        paddingHorizontal: screenHorizontalPadding,
        paddingVertical: theme.spacing.xs,
      }}
    >
      <VStack>
        <Text size="xs">
          {translate("ephemeral_account_banner.title")}.{" "}
          {translate("ephemeral_account_banner.subtitle")}
        </Text>
      </VStack>
    </TouchableOpacity>
  );
});

const useConversationListItems = () => {
  const currentAccount = useCurrentAccount();

  const { data: conversations, ...rest } = useConversationListQuery({
    account: currentAccount!,
    context: "conversation-list-screen",
  });

  const { topicsData } = useChatStore(useSelect(["topicsData"]));

  const pinnedConversationTopics = useConversationListStoreForCurrentAccount(
    (s) => s.pinnedConversationTopics
  );

  const conversationsFiltered = useMemo(() => {
    const pinnedTopics = new Set(pinnedConversationTopics);
    const deletedTopics = new Set(
      Object.entries(topicsData)
        .filter(([_, data]) => data?.status === "deleted")
        .map(([topic]) => topic)
    );

    return conversations?.filter((conversation) => {
      const isAllowed = isConversationAllowed(conversation);
      const isNotPinned = !pinnedTopics.has(conversation.topic);
      const isNotDeleted = !deletedTopics.has(conversation.topic);

      return isAllowed && isNotPinned && isNotDeleted;
    });
  }, [conversations, pinnedConversationTopics, topicsData]);

  return { data: conversationsFiltered, ...rest };
};

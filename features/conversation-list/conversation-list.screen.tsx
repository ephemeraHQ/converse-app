import Avatar from "@/components/Avatar";
import {
  useShouldShowConnecting,
  useShouldShowConnectingOrSyncing,
} from "@/components/Connecting";
import { ConversationContextMenu } from "@/components/ConversationContextMenu";
import { ErroredHeader } from "@/components/ErroredHeader";
import { Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { Icon } from "@/design-system/Icon/Icon";
import { Pressable } from "@/design-system/Pressable";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { ConversationListItemDumb } from "@/features/conversation-list/components/conversation-list-item";
import { ConversationList } from "@/features/conversation-list/components/conversation-list/conversation-list";
import { usePreferredName } from "@/hooks/usePreferredName";
import { useShouldShowErrored } from "@/hooks/useShouldShowErrored";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureError } from "@/utils/capture-error";
import { Haptics } from "@/utils/haptics";
import { shortDisplayName } from "@/utils/str";
import { useAccountsProfiles } from "@/utils/useAccountsProfiles";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useDisconnectActionSheet } from "@hooks/useDisconnectActionSheet";
import { useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { memo, useCallback } from "react";
import {
  Alert,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import {
  ContextMenuButton,
  MenuActionConfig,
} from "react-native-ios-context-menu";
import InitialLoad from "../../components/InitialLoad";
import { PinnedConversations } from "../../components/PinnedConversations/PinnedConversations";
import Recommendations from "../../components/Recommendations/Recommendations";
import {
  useAccountsList,
  useAccountsStore,
  useChatStore,
  useCurrentAccount,
  useSettingsStore,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { ConversationFlatListItem } from "../../utils/conversation";
import ChatNullState from "./components/ChatNullState";
import { useConversationListItems } from "./useConversationListItems";
import { useConversationListRequestCount } from "./useConversationListRequestCount";

type FlatListItemType = ConversationFlatListItem | ConversationWithCodecsType;

type IConversationListProps = NativeStackScreenProps<
  NavigationParamList,
  "Chats" | "Blocked"
>;

export function ConversationListScreen({
  navigation,
  route,
}: IConversationListProps) {
  // const { theme } = useAppTheme();
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

  const currentAccount = useCurrentAccount();

  const {
    data: conversations,
    isLoading: isLoadingConversations,
    refetch,
  } = useConversationListItems();

  // const [flatListItems, setFlatListItems] = useState<{
  //   items: FlatListItemType[];
  //   searchQuery: string;
  // }>({ items: [], searchQuery: "" });

  // const showNoResult = flatListItems.items.length === 0 && !!searchQuery;

  const requestsCount = useConversationListRequestCount();

  const showChatNullState =
    conversations?.length === 0 &&
    // !searchQuery &&
    !isLoadingConversations &&
    requestsCount === 0;

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
      await refetch();
    } catch (error) {
      captureError(error);
    }
  }, [refetch]);

  if (showChatNullState) {
    return (
      <ChatNullState
        currentAccount={currentAccount!}
        navigation={navigation}
        route={route}
      />
    );
  }

  return (
    <VStack
      // {...debugBorder()}
      style={{
        flex: 1,
      }}
    >
      <ConversationList
        conversations={isLoadingConversations ? [] : (conversations ?? [])}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={
          isLoadingConversations ? <InitialLoad /> : undefined
        }
        onRefetch={handleRefresh}
      />
      <Recommendations visibility="HIDDEN" />
      <ConversationContextMenu />
    </VStack>
  );
}

const ListHeader = React.memo(function ListHeader() {
  const pinnedConversations = useChatStore((s) => s.pinnedConversationTopics);
  const { ephemeralAccount } = useSettingsStore(
    useSelect(["ephemeralAccount"])
  );

  return (
    <VStack style={{}}>
      <States />
      {ephemeralAccount && <EphemeralAccountBanner />}
      <PinnedConversations topics={pinnedConversations} />
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
    <ConversationListItemDumb
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
      leftActionIcon="chevron.right"
      isUnread={false}
      showError={false}
      showImagePreview={false}
      imagePreviewUrl={undefined}
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
              navigation.navigate("NewConversation", {});
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
            hitSlop={theme.spacing.sm}
            isMenuPrimaryAction
            onPressMenuItem={({ nativeEvent }) => {
              if (nativeEvent.actionKey === "all-chats") {
                Alert.alert("Coming soon");
              } else if (nativeEvent.actionKey === "new-account") {
                navigation.navigate("NewAccountNavigator");
              } else if (nativeEvent.actionKey === "app-settings") {
                Alert.alert("Coming soon");
              }
              // Pressed on an account
              else {
                Haptics.selectionAsync();
                setCurrentAccount(nativeEvent.actionKey, false);
              }
            }}
            menuConfig={{
              menuTitle: "",
              menuItems: [
                {
                  actionKey: "all-chats",
                  actionTitle: "Convos",
                  actionSubtitle: "All chats",
                },
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
                      actionTitle: "New Account",
                      icon: {
                        iconType: "SYSTEM",
                        iconValue: Platform.select({
                          default: "plus",
                          ios: "plus",
                          android: "plus",
                        }),
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
                      actionTitle: "App Settings",
                      icon: {
                        iconType: "SYSTEM",
                        iconValue: Platform.select({
                          default: "gearshape",
                          ios: "gearshape",
                          android: "settings",
                        }),
                      },
                    },
                  ],
                },
              ],
            }}
          >
            <HStack
              style={{
                alignItems: "center",
                columnGap: theme.spacing.xxxs,
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

  return (
    <TouchableOpacity
      onPress={() => showDisconnectActionSheet(colorScheme)}
      style={{
        width: "100%",
        backgroundColor: theme.colors.background.blurred,
        paddingHorizontal: theme.spacing.lg,
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

import React, { useCallback, useState } from "react";
import {
  View,
  ViewStyle,
  Alert,
  Share,
  Platform,
  Linking,
  TextStyle,
} from "react-native";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { ContactCard } from "@/features/profiles/components/ContactCard";
import { Table } from "@/design-system/Table/Table";
import { VStack } from "@/design-system/VStack";
import { Text } from "@/design-system/Text";
import { useRoute, useRouter } from "@navigation/useNavigation";
import { usePreferredName } from "@/hooks/usePreferredName";
import { usePreferredUsername } from "@/hooks/usePreferredUsername";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { useProfileSocials } from "@/hooks/useProfileSocials";
import {
  useCurrentAccount,
  useSettingsStore,
} from "@/data/store/accountsStore";
import { useAppTheme, ThemedStyle } from "@/theme/useAppTheme";
import { translate } from "@/i18n";
import { formatUsername } from "@/features/profiles/utils/formatUsername";
import { Button } from "@/design-system/Button/Button";
import { useHeader } from "@/navigation/use-header";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { HStack } from "@/design-system/HStack";
import { navigate } from "@/utils/navigation";
import { Haptics } from "@/utils/haptics";
import Clipboard from "@react-native-clipboard/clipboard";
import { updateConsentForAddressesForAccount } from "@/features/consent/update-consent-for-addresses-for-account";
import { StackActions } from "@react-navigation/native";
import { useDisconnectActionSheet } from "@/hooks/useDisconnectActionSheet";
import { getConfig } from "@/config";
import { useProfileSocials } from "@/hooks/useProfileSocials";
import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";
import { iconRegistry } from "@/design-system/Icon/Icon";
import { useAppStore } from "@/data/store/appStore";
import { requestPushNotificationsPermissions } from "@/features/notifications/utils/requestPushNotificationsPermissions";
import { Chip } from "@/design-system/chip";

export default function ProfileScreen() {
  const [editMode, setEditMode] = useState(false);
  const { theme, themed } = useAppTheme();
  const router = useRouter();
  const route = useRoute<"Profile">();
  const peerAddress = route.params.address;
  const userAddress = useCurrentAccount() as string;
  const isMyProfile = peerAddress.toLowerCase() === userAddress?.toLowerCase();
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const { data: socials } = useProfileSocials(peerAddress);
  const { notificationsPermissionStatus, setNotificationsPermissionStatus } =
    useAppStore((s) => ({
      notificationsPermissionStatus: s.notificationsPermissionStatus,
      setNotificationsPermissionStatus: s.setNotificationsPermissionStatus,
    }));

  const { data: socials } = useProfileSocials(peerAddress);
  const userName = usePreferredUsername(userAddress);
  const displayName = usePreferredName(userAddress);
  const preferredAvatarUri = usePreferredAvatarUri(peerAddress);
  
  const handleChatPress = useCallback(() => {
    router.dispatch(StackActions.popToTop());
    router.dispatch(
      StackActions.push("Conversation", {
        peer: peerAddress,
      })
    );
  }, [router, peerAddress]);

  const handleEditProfile = useCallback(() => {
    setEditMode(!editMode);
  }, [editMode]);

  const showDisconnectActionSheet = useDisconnectActionSheet();

  const isBlockedPeer = useSettingsStore(
    (s) => s.peersStatus[peerAddress.toLowerCase()] === "blocked"
  );

  const handleContextMenuAction = useCallback(
    (actionId: string) => {
      Haptics.selectionAsync();
      if (actionId === "share") {
        if (isMyProfile) {
          navigate("ShareProfile");
        } else {
          const profileUrl = `https://${
            getConfig().websiteDomain
          }/dm/${userName}`;
          Clipboard.setString(profileUrl);
          Share.share({
            message: profileUrl,
          });
        }
      } else if (actionId === "edit") {
        Alert.alert("Available soon");
        // TODO - Profile Edit
        // handleEditProfile();
      } else if (actionId === "block") {
        showActionSheetWithOptions(
          {
            options: [
              isBlockedPeer ? translate("unblock") : translate("block"),
              translate("cancel"),
            ],
            cancelButtonIndex: 1,
            destructiveButtonIndex: isBlockedPeer ? undefined : 0,
            title: isBlockedPeer
              ? translate("if_you_unblock_contact")
              : translate("if_you_block_contact"),
          },
          (selectedIndex?: number) => {
            if (selectedIndex === 0 && peerAddress) {
              const newStatus = isBlockedPeer ? "consented" : "blocked";
              const consentOnProtocol = isBlockedPeer ? "allow" : "deny";
              consentToAddressesOnProtocolByAccount({
                account: userAddress,
                addresses: [peerAddress],
                consent: consentOnProtocol,
              });
              setPeersStatus({ [peerAddress]: newStatus });
              router.goBack();
            }
          }
        );
      }
    },
    [
      isMyProfile,
      userName,
      isBlockedPeer,
      peerAddress,
      userAddress,
      setPeersStatus,
      router,
    ]
  );

  // Header configuration
  useHeader(
    {
      safeAreaEdges: ["top"],
      titleComponent: (
        <Text preset="body">
          {router.canGoBack() && router.getState().routes.length >= 2
            ? router.getState().routes[router.getState().routes.length - 2].name
            : ""}
        </Text>
      ),
      LeftActionComponent: (
        <HeaderAction
          icon="chevron.left"
          onPress={() => {
            router.goBack();
          }}
        />
      ),
      RightActionComponent: (
        <HStack style={themed($headerRight)}>
          {editMode ? (
            <Button
              text={translate("profile.done")}
              variant="text"
              onPress={() => {
                handleEditProfile();
                setEditMode(false);
              }}
            />
          ) : (
            <>
              {isMyProfile ? (
                <HeaderAction
                  icon="qrcode"
                  onPress={() => {
                    navigate("ShareProfile");
                  }}
                />
              ) : (
                <HeaderAction
                  style={themed($editIcon)}
                  icon="square.and.pencil"
                  onPress={handleChatPress}
                />
              )}
              <DropdownMenu
                style={themed($contextMenu)}
                onPress={handleContextMenuAction}
                actions={[
                  ...(isMyProfile
                    ? [
                        {
                          id: "edit",
                          title: translate("profile.edit"),
                          image: iconRegistry["pencil"],
                        },
                        {
                          id: "share",
                          title: translate("share"),
                          image: iconRegistry["square.and.arrow.up"],
                        },
                      ]
                    : [
                        {
                          id: "share",
                          title: translate("share"),
                          image: iconRegistry["square.and.arrow.up"],
                        },
                        {
                          id: "block",
                          title: isBlockedPeer
                            ? translate("unblock")
                            : translate("block"),
                          image: isBlockedPeer
                            ? iconRegistry["person.crop.circle.badge.plus"]
                            : iconRegistry["person.crop.circle.badge.xmark"],
                          color: !isBlockedPeer
                            ? theme.colors.global.caution
                            : undefined,
                        },
                      ]),
                ]}
              >
                <HeaderAction icon="more_vert" />
              </DropdownMenu>
            </>
          )}
        </HStack>
      ),
    },
    [
      router,
      theme,
      peerAddress,
      displayName,
      setPeersStatus,
      handleChatPress,
      editMode,
      handleContextMenuAction,
      isMyProfile,
      isBlockedPeer,
    ]
  );

  return (
    <Screen preset="fixed" style={themed($container)}>
      <VStack>
        <VStack style={themed($section)}>
          <ContactCard
            displayName={displayName}
            userName={formatUsername(userName)}
            avatarUri={preferredAvatarUri}
            isMyProfile={isMyProfile}
            editMode={editMode}
            onToggleEdit={handleEditProfile}
          />
        </VStack>

        {/* Names Section */}
        {((socials?.userNames?.length ?? 0) > 0 ||
          (socials?.ensNames?.length ?? 0) > 0 ||
          (socials?.unstoppableDomains?.length ?? 0) > 0) && (
          <VStack style={[themed($section), { paddingTop: theme.spacing.md }]}>
            <Text>{translate("profile.names")}</Text>
            <HStack style={themed($chipContainer)}>
              {socials?.userNames?.map((username) => (
                <Chip
                  isActive
                  key={username.name}
                  text={username.name}
                  style={themed($chip)}
                  onPress={() => {
                    Clipboard.setString(username.name);
                    Alert.alert(translate("profile.copied"));
                  }}
                />
              ))}
              {socials?.ensNames?.map((ens) => (
                <Chip
                  isActive
                  key={ens.name}
                  text={ens.name}
                  style={themed($chip)}
                  onPress={() => {
                    Clipboard.setString(ens.name);
                    Alert.alert(translate("profile.copied"));
                  }}
                />
              ))}
              {socials?.unstoppableDomains
                ?.filter((d) => !d.domain.toLowerCase().endsWith(".eth"))
                .map((domain) => (
                  <Chip
                    isActive
                    key={domain.domain}
                    text={domain.domain}
                    style={themed($chip)}
                    onPress={() => {
                      Clipboard.setString(domain.domain);
                      Alert.alert(translate("profile.copied"));
                    }}
                  />
                ))}
            </HStack>
          </VStack>
        )}

        {isMyProfile && (
          <View>
            <VStack
              style={[themed($section), { paddingVertical: theme.spacing.lg }]}
            >
              <Table
                editMode={editMode}
                rows={[
                  ...(notificationsPermissionStatus !== "granted"
                    ? [
                        {
                          label: translate("turn_on_notifications"),
                          onPress: async () => {
                            if (notificationsPermissionStatus === "denied") {
                              if (Platform.OS === "android") {
                                // Android 13 is always denied first so let's try to show
                                const newStatus =
                                  await requestPushNotificationsPermissions();
                                if (newStatus === "denied") {
                                  Linking.openSettings();
                                } else if (newStatus) {
                                  setNotificationsPermissionStatus(newStatus);
                                }
                              } else {
                                Linking.openSettings();
                              }
                            } else if (
                              notificationsPermissionStatus === "undetermined"
                            ) {
                              // Open popup
                              const newStatus =
                                await requestPushNotificationsPermissions();
                              if (!newStatus) return;
                              setNotificationsPermissionStatus(newStatus);
                            }
                          },
                        },
                      ]
                    : []),
                  {
                    label: translate("profile.settings.archive"),
                    onPress: () => {
                      router.navigate("Blocked");
                    },
                  },
                  /*{
                    label: translate("profile.settings.keep_messages"),
                    value: "Forever",
                    onValueChange: () => {},
                  },*/
                  {
                    label: translate("log_out"),
                    isWarning: true,
                    onPress: () =>
                      showDisconnectActionSheet(
                        theme.isDark ? "dark" : "light"
                      ),
                  },
                ]}
              />
            </VStack>
          </View>
        )}
      </VStack>
    </Screen>
  );
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.sunken,
});

const $section: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background.surface,
  borderBottomWidth: spacing.xxs,
  borderBottomColor: colors.background.sunken,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xs,
});

const $headerRight: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  columnGap: spacing.xxs,
});

const $editIcon: ThemedStyle<ViewStyle> = () => ({
  marginBottom: 4, // Centers the square.and.pencil icon
});

const $contextMenu: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.sm,
  paddingRight: spacing.xxxs,
});

const $chipContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexWrap: "wrap",
  gap: spacing.xs,
  paddingVertical: spacing.sm,
});

const $chip: ThemedStyle<ViewStyle> = ({ colors, borderRadius }) => ({
  backgroundColor: colors.background.surface,
  borderColor: colors.border.subtle,
  borderRadius: borderRadius.xs,
});

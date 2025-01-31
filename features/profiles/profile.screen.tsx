import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { config } from "@/config";
import {
  useCurrentAccount,
  useSettingsStore,
} from "@/data/store/accountsStore";
import { Button } from "@/design-system/Button/Button";
import { HStack } from "@/design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { iconRegistry } from "@/design-system/Icon/Icon";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";
import { SettingsList } from "@/design-system/settings-list/settings-list";
import { updateConsentForAddressesForAccount } from "@/features/consent/update-consent-for-addresses-for-account";
import { useNotificationsPermission } from "@/features/notifications/hooks/use-notifications-permission";
import { SocialNames } from "@/features/profiles/components/social-names";
import { formatConverseUsername } from "@/features/profiles/utils/format-converse-username";
import { useDisconnectActionSheet } from "@/hooks/useDisconnectActionSheet";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { usePreferredName } from "@/hooks/usePreferredName";
import { usePreferredUsername } from "@/hooks/usePreferredUsername";
import { useProfileSocials } from "@/hooks/useProfileSocials";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Haptics } from "@/utils/haptics";
import { navigate } from "@/utils/navigation";
import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import { useRoute, useRouter } from "@navigation/useNavigation";
import Clipboard from "@react-native-clipboard/clipboard";
import { StackActions } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Alert, Share, View, ViewStyle } from "react-native";
import { ProfileContactCard } from "./components/profile-contact-card";

export function ProfileScreen() {
  const [editMode, setEditMode] = useState(false);
  const { theme, themed } = useAppTheme();
  const router = useRouter();
  const route = useRoute<"Profile">();
  const peerAddress = route.params.address;
  const userAddress = useCurrentAccount() as string;
  const isMyProfile = peerAddress.toLowerCase() === userAddress?.toLowerCase();
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const { data: socials } = useProfileSocials(peerAddress);
  const { notificationsPermissionStatus, requestPermission } =
    useNotificationsPermission();

  const userName = usePreferredUsername(peerAddress);
  const displayName = usePreferredName(peerAddress);
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
    async (actionId: string) => {
      Haptics.selectionAsync();
      switch (actionId) {
        case "edit":
          setEditMode(true);
          break;
        case "share":
          if (isMyProfile) {
            navigate("ShareProfile");
          } else {
            const shareUrl = `${config.webAppUrl}/profile/${peerAddress}`;
            await Share.share({
              message: shareUrl,
            });
          }
          break;
        case "block":
          Alert.alert(
            translate(isBlockedPeer ? "unblock_title" : "block_title"),
            translate(isBlockedPeer ? "unblock_message" : "block_message", {
              name: userName,
            }),
            [
              {
                text: translate("cancel"),
                style: "cancel",
              },
              {
                text: translate(isBlockedPeer ? "unblock" : "block"),
                style: isBlockedPeer ? "default" : "destructive",
                onPress: async () => {
                  const newStatus = isBlockedPeer ? "consented" : "blocked";
                  await updateConsentForAddressesForAccount({
                    account: userAddress,
                    addresses: [peerAddress],
                    consent: isBlockedPeer ? "allow" : "deny",
                  });
                  setPeersStatus({ [peerAddress]: newStatus });
                  router.goBack();
                },
              },
            ]
          );
          break;
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
      backgroundColor: theme.colors.background.surface,
      safeAreaEdges: ["top"],
      titleComponent: (
        <Text preset="body">
          {router.canGoBack()
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
        <HStack
          style={{
            alignItems: "center",
            columnGap: theme.spacing.xxs,
          }}
        >
          {editMode ? (
            <Button
              text={translate("profile.done")}
              variant="text"
              onPress={handleEditProfile}
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
                  style={{
                    marginBottom: 4, // Centers the square.and.pencil icon
                  }}
                  icon="square.and.pencil"
                  onPress={handleChatPress}
                />
              )}
              <DropdownMenu
                style={{
                  paddingVertical: theme.spacing.sm,
                  paddingRight: theme.spacing.xxxs,
                }}
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
      editMode,
      isMyProfile,
      handleChatPress,
      handleContextMenuAction,
      isBlockedPeer,
      handleEditProfile,
    ]
  );

  return (
    <Screen preset="fixed" style={themed($container)}>
      <VStack>
        <VStack style={themed($section)}>
          <ProfileContactCard
            displayName={displayName}
            userName={formatConverseUsername(userName)?.username}
            avatarUri={preferredAvatarUri}
            isMyProfile={isMyProfile}
            editMode={editMode}
            onToggleEdit={handleEditProfile}
          />
        </VStack>

        {socials &&
          (() => {
            // Filter out Converse usernames
            const filteredUserNames = socials.userNames?.filter(
              (u) => !formatConverseUsername(u.name)?.isConverseUsername
            );

            // Filter out .eth domains from unstoppable domains to avoid duplicates
            const filteredUnstoppableDomains =
              socials.unstoppableDomains?.filter(
                (d) => d.domain && !d.domain.toLowerCase().endsWith(".eth")
              );

            // Only render if there are names to display after filtering
            if (
              (filteredUserNames?.length ?? 0) > 0 ||
              (socials.ensNames?.length ?? 0) > 0 ||
              (filteredUnstoppableDomains?.length ?? 0) > 0
            ) {
              return (
                <VStack style={[themed($section), themed($borderTop)]}>
                  <SocialNames
                    socials={{
                      userNames: filteredUserNames?.map((u) => ({
                        name: u.name,
                      })),
                      ensNames: socials.ensNames?.map((e) => ({
                        name: e.name,
                      })),
                      unstoppableDomains: filteredUnstoppableDomains?.map(
                        (d) => ({
                          name: d.domain,
                        })
                      ),
                    }}
                  />
                </VStack>
              );
            }
            return null;
          })()}

        {isMyProfile && (
          <VStack style={[themed($section), themed($borderTop)]}>
            <SettingsList
              editMode={editMode}
              rows={[
                ...(notificationsPermissionStatus !== "granted"
                  ? [
                      {
                        label: translate("turn_on_notifications"),
                        onPress: requestPermission,
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
                    showDisconnectActionSheet(theme.isDark ? "dark" : "light"),
                },
              ]}
            />
          </VStack>
        )}
      </VStack>
    </Screen>
  );
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.surface,
});

const $section: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background.surface,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xs,
});

const $borderTop: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderTopWidth: spacing.xxs,
  borderTopColor: colors.background.sunken,
});

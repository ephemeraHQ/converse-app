import React, { useCallback, useState } from "react";
import { View, ViewStyle, Alert, Share } from "react-native";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { ContactCard } from "@/features/profiles/components/contact-card";
import { SettingsList } from "@/design-system/settings-list/settings-list";
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
import { formatConverseUsername } from "@/features/profiles/utils/format-converse-username";
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
import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";
import { iconRegistry } from "@/design-system/Icon/Icon";
import { useNotificationsPermission } from "@/features/notifications/hooks/use-notifications-permission";
import { SocialNames } from "@/features/profiles/components/social-names";

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
              updateConsentForAddressesForAccount({
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
            userName={formatConverseUsername(userName)?.username}
            avatarUri={preferredAvatarUri}
            isMyProfile={isMyProfile}
            editMode={editMode}
            onToggleEdit={handleEditProfile}
          />
        </VStack>

        <SocialNames
          socials={{
            userNames: socials?.userNames?.map((u) => ({ name: u.name })),
            ensNames: socials?.ensNames?.map((e) => ({ name: e.name })),
            unstoppableDomains: socials?.unstoppableDomains?.map((d) => ({
              name: d.domain,
            })),
          }}
        />

        {isMyProfile && (
          <View>
            <VStack
              style={[themed($section), { paddingVertical: theme.spacing.lg }]}
            >
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

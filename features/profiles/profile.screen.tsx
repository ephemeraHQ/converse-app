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
import { FilteredSocialNames } from "@/features/profiles/components/filtered-social-names";
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
import { updateConsentForAddressesForAccount } from "@/utils/xmtpRN/xmtp-consent/update-consent-for-addresses-for-account";
import { useRoute, useRouter } from "@navigation/useNavigation";
import { StackActions } from "@react-navigation/native";
import React, { useCallback, useState, useRef } from "react";
import { Alert, Share, ViewStyle } from "react-native";
import { ProfileContactCard } from "./components/profile-contact-card";
import { ProfileContactCardHandle } from "./profile-types";

export function ProfileScreen() {
  const [editMode, setEditMode] = useState(false);
  const profileCardRef = useRef<ProfileContactCardHandle>(null);
  const { theme, themed } = useAppTheme();
  const router = useRouter();
  const route = useRoute<"Profile">();
  const peerAddress = route.params.address;
  const userAddress = useCurrentAccount() as string;
  const isMyProfile = peerAddress.toLowerCase() === userAddress?.toLowerCase();
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const { data: socials } = useProfileSocials(peerAddress);

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

  const handleEditProfile = useCallback(async () => {
    if (editMode) {
      // Try to save if there are changes
      if (profileCardRef.current?.hasChanges) {
        setEditMode(false); // Optimistically exit edit mode
        const saveResult = await profileCardRef.current?.handleSave();
        // If save failed, go back to edit mode
        if (!saveResult?.success) {
          setEditMode(true);
        }
      } else {
        // If no changes, just exit edit mode
        setEditMode(false);
      }
      return;
    }
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
            const shareUrl = `${config.websiteDomain}/profile/${peerAddress}`;
            await Share.share({
              message: shareUrl,
            });
          }
          break;
        case "block":
          Alert.alert(
            translate(
              isBlockedPeer
                ? "userProfile.unblock.title"
                : "userProfile.block.title"
            ),
            translate(
              isBlockedPeer
                ? "userProfile.unblock.message"
                : "userProfile.block.message",
              {
                name: displayName,
              }
            ),
            [
              {
                text: translate("cancel"),
                style: "cancel",
              },
              {
                text: translate(
                  isBlockedPeer
                    ? "userProfile.unblock.title"
                    : "userProfile.block.title"
                ),
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
      displayName,
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
        <HStack style={themed($headerRightContainer)}>
          {editMode ? (
            <Button
              text={translate("userProfile.done")}
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
                  style={themed($chatIcon)}
                  icon="square.and.pencil"
                  onPress={handleChatPress}
                />
              )}
              <DropdownMenu
                style={themed($dropdownMenu)}
                onPress={handleContextMenuAction}
                actions={[
                  ...(isMyProfile
                    ? [
                        {
                          id: "edit",
                          title: translate("userProfile.edit"),
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
                            ? translate("userProfile.unblock.title")
                            : translate("userProfile.block.title"),
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
            ref={profileCardRef}
            displayName={displayName}
            userName={formatConverseUsername(userName)?.username}
            avatarUri={preferredAvatarUri}
            isMyProfile={isMyProfile}
            editMode={editMode}
          />
        </VStack>

        {socials && <FilteredSocialNames socials={socials} />}

        {isMyProfile && (
          <VStack style={[themed($section), themed($borderTop)]}>
            <SettingsList
              editMode={editMode}
              rows={[
                {
                  label: translate("userProfile.settings.archive"),
                  onPress: () => {
                    router.navigate("Blocked");
                  },
                },
                /*{
                  label: translate("userProfile.settings.keep_messages"),
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

const $headerRightContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  columnGap: spacing.xxs,
});

const $chatIcon: ThemedStyle<ViewStyle> = () => ({
  marginBottom: 4, // Centers the square.and.pencil icon
});

const $dropdownMenu: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.sm,
  paddingRight: spacing.xxxs,
});

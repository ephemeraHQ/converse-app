import React, { useCallback, useState } from "react";
import { View, ViewStyle, Alert, Share } from "react-native";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { ContactCard } from "@/features/profiles/components/ContactCard";
import { FullWidthTable } from "@/design-system/table/FullWidthTable";
import { VStack } from "@/design-system/VStack";
import { Text } from "@/design-system/Text";
import { useRoute, useRouter } from "@navigation/useNavigation";
import { usePreferredName } from "@/hooks/usePreferredName";
import { usePreferredUsername } from "@/hooks/usePreferredUsername";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
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
import { ContextMenuButton } from "react-native-ios-context-menu";
import { Haptics } from "@/utils/haptics";
import Clipboard from "@react-native-clipboard/clipboard";
import { updateConsentForAddressesForAccount } from "@/features/consent/update-consent-for-addresses-for-account";
import { StackActions } from "@react-navigation/native";
import { useDisconnectActionSheet } from "@/hooks/useDisconnectActionSheet";
import { getConfig } from "@/config";
import { useProfileSocials } from "@/hooks/useProfileSocials";

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
              <ContextMenuButton
                style={themed($contextMenu)}
                isMenuPrimaryAction
                menuConfig={{
                  menuTitle: "",
                  menuItems: [
                    ...(isMyProfile
                      ? [
                          {
                            actionKey: "edit",
                            actionTitle: translate("profile.edit"),
                            icon: {
                              iconType: "SYSTEM" as const,
                              iconValue: "pencil",
                            },
                          },
                          {
                            actionKey: "share",
                            actionTitle: translate("share"),
                            icon: {
                              iconType: "SYSTEM" as const,
                              iconValue: "square.and.arrow.up",
                            },
                          },
                        ]
                      : [
                          {
                            actionKey: "share",
                            actionTitle: translate("share"),
                            icon: {
                              iconType: "SYSTEM" as const,
                              iconValue: "square.and.arrow.up",
                            },
                          },
                          {
                            actionKey: "block",
                            actionTitle: translate("block"),
                            icon: {
                              iconType: "SYSTEM" as const,
                              iconValue: "person.crop.circle.badge.xmark",
                            },
                            menuAttributes: ["destructive" as const],
                          },
                        ]),
                  ],
                }}
                onPressMenuItem={({ nativeEvent }) => {
                  Haptics.selectionAsync();
                  if (nativeEvent.actionKey === "share") {
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
                  } else if (nativeEvent.actionKey === "edit") {
                    Alert.alert("Available soon");
                    // TODO - Profile Edit
                    // handleEditProfile();
                  } else if (nativeEvent.actionKey === "block") {
                    Alert.alert(
                      translate("profile.block.title"),
                      translate("profile.block.message", {
                        name: displayName,
                      }),
                      [
                        {
                          text: translate("cancel"),
                          style: "cancel",
                        },
                        {
                          text: translate("block"),
                          style: "destructive",
                          onPress: () => {
                            setPeersStatus({ [peerAddress]: "blocked" });
                            router.goBack();
                          },
                        },
                      ]
                    );
                  }
                }}
              >
                <HeaderAction icon="more_vert" />
              </ContextMenuButton>
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

        {isMyProfile && (
          <View>
            <VStack
              style={[themed($section), { paddingVertical: theme.spacing.lg }]}
            >
              <FullWidthTable
                editMode={editMode}
                rows={[
                  {
                    label: translate("profile.settings.notifications"),
                    value: "On",
                    isSwitch: true,
                    isEnabled: true,
                    onValueChange: () => {},
                  },
                  {
                    label: translate("profile.settings.archive"),
                    value: "Forever",
                    onValueChange: () => {},
                  },
                  {
                    label: translate("profile.settings.keep_messages"),
                    value: "Forever",
                    onValueChange: () => {},
                  },
                  {
                    label: translate("profile.settings.blocked"),
                    value: "None",
                    onValueChange: () => {},
                  },
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

        {!isMyProfile && (
          <>
            <VStack
              style={[themed($section), { paddingVertical: theme.spacing.lg }]}
            >
              <FullWidthTable
                rows={[
                  {
                    label: translate("profile.settings.notifications"),
                    value: "On",
                    isSwitch: true,
                    isEnabled: true,
                    onValueChange: () => {},
                  },
                ]}
              />
            </VStack>
          </>
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

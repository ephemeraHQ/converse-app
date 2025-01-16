import React, { memo, useCallback, useState } from "react";
import { View, ViewStyle, Alert } from "react-native";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { ContactCard } from "@/features/profiles/components/ContactCard";
import { FullWidthTable } from "@/design-system/table/FullWidthTable";
import { VStack } from "@/design-system/VStack";
import { Text } from "@/design-system/Text";
import { useRoute, useRouter } from "@navigation/useNavigation";
import { usePreferredName } from "@/hooks/usePreferredName";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { useProfileSocials } from "@/hooks/useProfileSocials";
import {
  useCurrentAccount,
  useSettingsStore,
  currentAccount,
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
  const preferredName = usePreferredName(peerAddress);
  const userName = socials?.userNames?.find((e) => e.isPrimary)?.name;

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

  // Header configuration
  useHeader(
    {
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
        <HStack style={themed($headerRight)}>
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
            onPressMenuItem={({ nativeEvent }) => {
              Haptics.selectionAsync();
              if (nativeEvent.actionKey === "share") {
                navigate("ShareProfile");
              } else if (nativeEvent.actionKey === "copy") {
                Clipboard.setString(peerAddress);
              } else if (nativeEvent.actionKey === "block") {
                Alert.alert(
                  translate("profile.block.title"),
                  translate("profile.block.message", {
                    name: preferredName,
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
            menuConfig={{
              menuTitle: "",
              menuItems: [
                {
                  actionKey: "share",
                  actionTitle: translate("share"),
                  icon: {
                    iconType: "SYSTEM",
                    iconValue: "square.and.arrow.up",
                  },
                },
                {
                  actionKey: "copy",
                  actionTitle: translate("copy"),
                  icon: {
                    iconType: "SYSTEM",
                    iconValue: "doc.on.doc",
                  },
                },
                {
                  actionKey: "block",
                  actionTitle: translate("block"),
                  icon: {
                    iconType: "SYSTEM",
                    iconValue: "person.crop.circle.badge.xmark",
                  },
                  menuAttributes: ["destructive"],
                },
              ],
            }}
          >
            <HeaderAction icon="more_vert" />
          </ContextMenuButton>
        </HStack>
      ),
    },
    [router, theme, peerAddress, preferredName, setPeersStatus, handleChatPress]
  );

  return (
    <Screen preset="fixed" style={themed($container)}>
      <VStack>
        <VStack style={themed($section)}>
          <ContactCard
            displayName={preferredName}
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

const $settingsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
  borderTopWidth: spacing.xxs, // Add top border to create separation
});

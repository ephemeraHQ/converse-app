import { Avatar } from "@/components/avatar";
import { Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { Icon, iconRegistry } from "@/design-system/Icon/Icon";
import { Pressable } from "@/design-system/Pressable";
import { Text } from "@/design-system/Text";
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";
import {
  useMultiInboxStore,
  useCurrentProfiles,
  useSafeCurrentSenderProfile,
  useSafeCurrentSender,
} from "@/features/multi-inbox/multi-inbox.store";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import { converseEventEmitter } from "@/utils/events";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Alert, ViewStyle } from "react-native";

export function useConversationListScreenHeader() {
  const { theme } = useAppTheme();

  useHeader(
    {
      safeAreaEdges: ["top"],
      style: {
        paddingHorizontal: theme.spacing.sm, // In Figma, for the conversation list, the header has bigger horizontal padding
      },
      RightActionComponent: <HeaderRightActions />,
      titleComponent: <HeaderTitle />,
    },
    [theme]
  );
}

function HeaderRightActions() {
  const navigation = useNavigation();
  const { themed } = useAppTheme();

  return (
    <HStack style={themed($rightContainer)}>
      <HeaderAction
        icon="qrcode"
        onPress={() => {
          navigation.navigate("ShareProfile");
        }}
      />
      <HeaderAction
        style={$newConversationContainer}
        icon="square.and.pencil"
        onPress={() => {
          navigation.navigate("Conversation", {
            isNew: true,
          });
        }}
      />
    </HStack>
  );
}

function HeaderTitle() {
  const { theme, themed } = useAppTheme();
  const navigation = useNavigation();
  const currentAccountInboxId = useSafeCurrentSender().inboxId;
  const { data: currentProfile } = useSafeCurrentSenderProfile();
  const { currentProfiles } = useCurrentProfiles();

  const onDropdownPress = useCallback(
    (profileXmtpInboxId: string) => {
      if (profileXmtpInboxId === "all-chats") {
        Alert.alert("Coming soon");
      } else if (profileXmtpInboxId === "new-account") {
        alert(
          "Under Construction - waiting on Privy for multiple embedded passkey support"
        );
        // navigation.navigate("NewAccountNavigator");
      } else if (profileXmtpInboxId === "app-settings") {
        navigation.navigate("AppSettings");
      } else {
        useMultiInboxStore.getState().setCurrentInboxId(profileXmtpInboxId);
      }
    },
    [navigation]
  );

  return (
    <HStack style={$titleContainer}>
      <ProfileAvatar />
      <DropdownMenu
        style={themed($dropDownMenu)}
        onPress={onDropdownPress}
        actions={[
          ...currentProfiles?.map((profile) => ({
            id: profile.id,
            title: profile.name,
            image: currentAccountInboxId === profile.xmtpId ? "checkmark" : "",
          })),
          {
            displayInline: true,
            id: "new-account",
            title: translate("new_account"),
            image: iconRegistry["new-account-card"],
          },
          {
            displayInline: true,
            id: "app-settings",
            title: translate("app_settings"),
            image: iconRegistry["settings"],
          },
        ]}
      >
        <HStack style={themed($rowContainer)}>
          <Text>{currentProfile?.name}</Text>
          <Center style={themed($iconContainer)}>
            <Icon
              color={theme.colors.text.secondary}
              icon="chevron.down"
              size={theme.iconSize.xs}
            />
          </Center>
        </HStack>
      </DropdownMenu>
    </HStack>
  );
}

function ProfileAvatar() {
  const { theme, themed } = useAppTheme();
  const navigation = useNavigation();

  const { inboxId } = useSafeCurrentSender();

  const { data: profile } = useProfileQuery({ xmtpId: inboxId });

  const showDebugMenu = useCallback(() => {
    converseEventEmitter.emit("showDebugMenu");
  }, []);

  return (
    <Pressable
      onPress={() => {
        navigation.navigate("Profile", {
          inboxId,
        });
      }}
      hitSlop={theme.spacing.sm}
      onLongPress={showDebugMenu}
    >
      <Center style={themed($avatarContainer)}>
        <Avatar
          uri={profile?.avatar}
          name={profile?.name}
          size={theme.avatarSize.sm}
        />
      </Center>
    </Pressable>
  );
}

const $dropDownMenu: ThemedStyle<ViewStyle> = (theme) => ({
  paddingVertical: theme.spacing.sm,
  paddingRight: theme.spacing.sm,
});

const $iconContainer: ThemedStyle<ViewStyle> = (theme) => ({
  width: theme.spacing.container.small,
  height: theme.spacing.container.small,
});

const $rowContainer: ThemedStyle<ViewStyle> = (theme) => ({
  alignItems: "center",
  columnGap: theme.spacing.xxxs,
});

const $rightContainer: ThemedStyle<ViewStyle> = (theme) => ({
  alignItems: "center",
  columnGap: theme.spacing.xxs,
});

const $newConversationContainer: ViewStyle = {
  marginBottom: 4, // The square.and.pencil icon is not centered with the qrcode if we don't have this margin
};

const $titleContainer: ViewStyle = {
  alignItems: "center",
};

const $avatarContainer: ThemedStyle<ViewStyle> = (theme) => ({
  padding: theme.spacing.xxs,
});

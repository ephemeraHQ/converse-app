import { Avatar } from "@/components/Avatar";
import {
  useAccountsList,
  useAccountsStore,
  useCurrentAccount,
} from "@/features/multi-inbox/multi-inbox.store";
import { Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { Icon, iconRegistry } from "@/design-system/Icon/Icon";
import { Pressable } from "@/design-system/Pressable";
import { Text } from "@/design-system/Text";
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";
import { useSafeCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { usePreferredInboxAvatar } from "@/hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { usePreferredName } from "@/hooks/usePreferredName";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { converseEventEmitter } from "@/utils/events";
import { shortDisplayName } from "@/utils/str";
import { useAccountsProfiles } from "@/utils/useAccountsProfiles";
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
  const currentAccount = useCurrentAccount();
  const preferredName = usePreferredName(currentAccount!);
  const accountsProfilesNames = useAccountsProfiles();
  const accounts = useAccountsList();
  const setCurrentAccount = useAccountsStore((s) => s.setCurrentAccount);

  const onDropdownPress = useCallback(
    (actionId: string) => {
      if (actionId === "all-chats") {
        Alert.alert("Coming soon");
      } else if (actionId === "new-account") {
        alert(
          "Under Construction - waiting on Privy for multiple embedded passkey support"
        );
        // navigation.navigate("NewAccountNavigator");
      } else if (actionId === "app-settings") {
        navigation.navigate("AppSettings");
      } else {
        setCurrentAccount({ ethereumAddress: actionId });
      }
    },
    [navigation, setCurrentAccount]
  );

  return (
    <HStack style={$titleContainer}>
      <ProfileAvatar />
      <DropdownMenu
        style={themed($dropDownMenu)}
        onPress={onDropdownPress}
        actions={[
          ...accountsProfilesNames.map((profilePreferedName, index) => ({
            id: accounts[index],
            title: shortDisplayName(profilePreferedName),
            image: currentAccount === accounts[index] ? "checkmark" : "",
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
          <Text>{shortDisplayName(preferredName)}</Text>
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
  const currentAccountInboxId = useSafeCurrentAccountInboxId();
  const { data: preferredName } = usePreferredInboxName({
    inboxId: currentAccountInboxId,
  });
  const { data: avatarUri } = usePreferredInboxAvatar({
    inboxId: currentAccountInboxId!,
  });

  const showDebugMenu = useCallback(() => {
    converseEventEmitter.emit("showDebugMenu");
  }, []);

  return (
    <Pressable
      onPress={() => {
        navigation.navigate("Profile", {
          inboxId: currentAccountInboxId,
        });
      }}
      hitSlop={theme.spacing.sm}
      onLongPress={showDebugMenu}
    >
      <Center style={themed($avatarContainer)}>
        <Avatar
          uri={avatarUri}
          name={preferredName}
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

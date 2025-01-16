import { Avatar } from "@/components/Avatar";
import {
  useAccountsList,
  useAccountsStore,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { Icon, iconRegistry } from "@/design-system/Icon/Icon";
import { Pressable } from "@/design-system/Pressable";
import { Text } from "@/design-system/Text";
import { usePreferredName } from "@/hooks/usePreferredName";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { shortDisplayName } from "@/utils/str";
import { useAccountsProfiles } from "@/utils/useAccountsProfiles";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Alert, ViewStyle } from "react-native";
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";

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

export function useHeaderWrapper() {
  const { theme, themed } = useAppTheme();
  const navigation = useNavigation();
  const currentAccount = useCurrentAccount();
  const preferredName = usePreferredName(currentAccount!);
  const accounts = useAccountsList();
  const accountsProfiles = useAccountsProfiles();
  const setCurrentAccount = useAccountsStore((s) => s.setCurrentAccount);

  const onDropdownPress = useCallback(
    (actionId: string) => {
      if (actionId === "all-chats") {
        Alert.alert("Coming soon");
      } else if (actionId === "new-account") {
        navigation.navigate("NewAccountNavigator");
      } else if (actionId === "app-settings") {
        Alert.alert("Coming soon");
      }

      // Pressed on an account
      else {
        setCurrentAccount(actionId, false);
      }
    },
    [navigation, setCurrentAccount]
  );

  useHeader(
    {
      safeAreaEdges: ["top"],
      RightActionComponent: (
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
              navigation.navigate("CreateConversation");
            }}
          />
        </HStack>
      ),
      titleComponent: (
        <HStack style={$titleContainer}>
          <Pressable
            onPress={() => {
              navigation.navigate("Profile", {
                address: currentAccount!,
              });
            }}
            hitSlop={theme.spacing.sm}
          >
            <Center style={themed($avatarContainer)}>
              <Avatar size={theme.avatarSize.sm} />
            </Center>
          </Pressable>
          <DropdownMenu
            style={themed($dropDownMenu)}
            onPress={onDropdownPress}
            actions={[
              ...accountsProfiles.map((profilePreferedName, index) => {
                return {
                  id: accounts[index],
                  title: shortDisplayName(profilePreferedName),
                  image: currentAccount === accounts[index] ? "checkmark" : "",
                };
              }),
              {
                displayInline: true,
                id: "new-account",
                title: translate("new_account"),
                image: iconRegistry["new-account-card"],
              },
              {
                displayInline: true,
                id: "app-settings",
                title: translate("App settings"),
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

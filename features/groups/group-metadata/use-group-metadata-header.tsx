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
import { useAppTheme } from "@/theme/useAppTheme";
import { Haptics } from "@/utils/haptics";
import { shortDisplayName } from "@/utils/str";
import { useAccountsProfiles } from "@/utils/useAccountsProfiles";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Alert, Platform } from "react-native";
import {
  ContextMenuButton,
  MenuActionConfig,
} from "react-native-ios-context-menu";

export function useGroupMetadataHeader() {
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
              navigation.navigate("NewConversation");
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
            // hitSlop={theme.spacing.sm} // Not working...
            style={{
              paddingVertical: theme.spacing.sm, // TMP solution for the hitSlop not working
              paddingRight: theme.spacing.sm, // TMP solution for the hitSlop not working
            }}
            isMenuPrimaryAction
            onPressMenuItem={({ nativeEvent }) => {
              Haptics.selectionAsync();
              if (nativeEvent.actionKey === "all-chats") {
                Alert.alert("Coming soon");
              } else if (nativeEvent.actionKey === "new-account") {
                navigation.navigate("NewAccountNavigator");
              } else if (nativeEvent.actionKey === "app-settings") {
                Alert.alert("Coming soon");
              }

              // Pressed on an account
              else {
                setCurrentAccount(nativeEvent.actionKey, false);
              }
            }}
            menuConfig={{
              menuTitle: "",
              menuItems: [
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
                      actionTitle: translate("new_account"),
                      icon: {
                        iconType: "SYSTEM",
                        iconValue: iconRegistry["new-account-card"],
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
                      actionTitle: translate("App settings"),
                      icon: {
                        iconType: "SYSTEM",
                        iconValue: iconRegistry["settings"],
                      },
                    },
                  ],
                },
              ],
            }}
          >
            <HStack
              // {...debugBorder()}
              style={{
                alignItems: "center",
                columnGap: theme.spacing.xxxs,
                // paddingVertical: theme.spacing.sm,
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

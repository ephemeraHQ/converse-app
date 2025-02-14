import { useRouter } from "@/navigation/useNavigation";

import { config } from "@/config";
import { HStack } from "@/design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { iconRegistry } from "@/design-system/Icon/Icon";
import { Text } from "@/design-system/Text";
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Haptics } from "@/utils/haptics";
import { InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { Share, ViewStyle } from "react-native";

export function useProfileOtherScreenHeader({ inboxId }: { inboxId: InboxId }) {
  const { theme, themed } = useAppTheme();
  const router = useRouter();

  const handleChatPress = useCallback(() => {
    router.push("Conversation", {
      searchSelectedUserInboxIds: [inboxId],
    });
  }, [router, inboxId]);

  const handleContextMenuAction = useCallback(
    async (actionId: string) => {
      Haptics.selectionAsync();
      switch (actionId) {
        case "share": {
          const shareUrl = `${config.websiteDomain}/profile/${inboxId}`;
          await Share.share({
            message: shareUrl,
          });
          break;
        }
        // TODO: Update with new backend
        // case "block":
        //   Alert.alert(
        //     translate(
        //       isBlockedPeer
        //         ? "userProfile.unblock.title"
        //         : "userProfile.block.title"
        //     ),
        //     translate(
        //       isBlockedPeer
        //         ? "userProfile.unblock.message"
        //         : "userProfile.block.message",
        //       {
        //         name: displayName,
        //       }
        //     ),
        //     [
        //       {
        //         text: translate("cancel"),
        //         style: "cancel",
        //       },
        //       {
        //         text: translate(
        //           isBlockedPeer
        //             ? "userProfile.unblock.title"
        //             : "userProfile.block.title"
        //         ),
        //         style: isBlockedPeer ? "default" : "destructive",
        //         onPress: async () => {
        //           await updateConsentForAddressesForAccount({
        //             account: userAddress,
        //             addresses: [peerAddress],
        //             consent: isBlockedPeer ? "allow" : "deny",
        //           });
        //           router.goBack();
        //         },
        //       },
        //     ]
        //   );
        // break;
      }
    },
    [inboxId]
  );

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
          <HeaderAction
            style={themed($chatIcon)}
            icon="square.and.pencil"
            onPress={handleChatPress}
          />
          <DropdownMenu
            style={themed($dropdownMenu)}
            onPress={handleContextMenuAction}
            actions={[
              {
                id: "share",
                title: translate("share"),
                image: iconRegistry["square.and.arrow.up"],
              },
              // TODO: This was using previous logic but we'll need to change with new backend
              // {
              //   id: "block",
              //   title: isBlockedPeer
              //     ? translate("userProfile.unblock.title")
              //     : translate("userProfile.block.title"),
              //   image: isBlockedPeer
              //     ? iconRegistry["person.crop.circle.badge.plus"]
              //     : iconRegistry["person.crop.circle.badge.xmark"],
              //   color: !isBlockedPeer
              //     ? theme.colors.global.caution
              //     : undefined,
              // },
            ]}
          >
            <HeaderAction icon="more_vert" />
          </DropdownMenu>
        </HStack>
      ),
    },
    [router, theme, handleChatPress, handleContextMenuAction]
  );
}

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

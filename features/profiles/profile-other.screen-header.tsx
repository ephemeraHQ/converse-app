import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { useCallback } from "react"
import { Share, ViewStyle } from "react-native"
import { config } from "@/config"
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu"
import { HeaderAction } from "@/design-system/Header/HeaderAction"
import { HStack } from "@/design-system/HStack"
import { iconRegistry } from "@/design-system/Icon/Icon"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { translate } from "@/i18n"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { Haptics } from "@/utils/haptics"

export function useProfileOtherScreenHeader({ inboxId }: { inboxId: IXmtpInboxId }) {
  const { theme, themed } = useAppTheme()
  const router = useRouter()

  const { displayName } = usePreferredDisplayInfo({ inboxId })

  const handleChatPress = useCallback(() => {
    router.navigate("Conversation", {
      searchSelectedUserInboxIds: [inboxId],
    })
  }, [router, inboxId])

  const handleContextMenuAction = useCallback(
    async (actionId: string) => {
      Haptics.selectionAsync()
      switch (actionId) {
        case "share": {
          const shareUrl = `${config.app.webDomain}/profile/${inboxId}`
          await Share.share({
            message: shareUrl,
          })
          break
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
    [inboxId],
  )

  useHeader(
    {
      backgroundColor: theme.colors.background.surface,
      safeAreaEdges: ["top"],
      title: displayName,
      LeftActionComponent: (
        <HeaderAction
          icon="chevron.left"
          onPress={() => {
            router.goBack()
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
    [router, theme, handleChatPress, handleContextMenuAction],
  )
}

const $headerRightContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  columnGap: spacing.xxs,
})

const $chatIcon: ThemedStyle<ViewStyle> = () => ({
  marginBottom: 4, // Centers the square.and.pencil icon
})

const $dropdownMenu: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.sm,
  paddingRight: spacing.xxxs,
})

import { useNavigation } from "@react-navigation/native"
import React, { useCallback } from "react"
import { Alert } from "react-native"
import { Center } from "@/design-system/Center"
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu"
import { HStack } from "@/design-system/HStack"
import { Icon, iconRegistry } from "@/design-system/Icon/Icon"
import { Text } from "@/design-system/Text"
import {
  useMultiInboxStore,
  useSafeCurrentSender,
} from "@/features/authentication/multi-inbox.store"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { translate } from "@/i18n"
import { useAppTheme } from "@/theme/use-app-theme"
import { shortAddress } from "@/utils/strings/shortAddress"
import {
  $dropDownMenu,
  $iconContainer,
  $rowContainer,
  $titleContainer,
  ProfileAvatar,
} from "../../conversation/conversation-list/conversation-list.screen-header"

export function AccountSwitcher(props: { noAvatar?: boolean }) {
  const { noAvatar } = props

  const { theme, themed } = useAppTheme()
  const navigation = useNavigation()
  const currentAccountInboxId = useSafeCurrentSender().inboxId
  const { displayName } = usePreferredDisplayInfo({
    inboxId: currentAccountInboxId,
  })

  const senders = useMultiInboxStore((state) => state.senders)
  const preferredSendersDisplayInfos = usePreferredDisplayInfoBatch({
    xmtpInboxIds: senders.map((sender) => sender.inboxId),
  })

  const onDropdownPress = useCallback(
    (profileXmtpInboxId: string) => {
      if (profileXmtpInboxId === "all-chats") {
        Alert.alert("Coming soon")
      } else if (profileXmtpInboxId === "new-account") {
        alert("Under Construction - waiting on Privy for multiple embedded passkey support")
      } else if (profileXmtpInboxId === "app-settings") {
        navigation.navigate("AppSettings")
      } else {
        useMultiInboxStore.getState().actions.setCurrentSender({
          inboxId: profileXmtpInboxId as IXmtpInboxId,
        })
      }
    },
    [navigation],
  )

  return (
    <HStack style={themed($titleContainer)}>
      {!noAvatar && <ProfileAvatar />}
      <DropdownMenu
        style={themed($dropDownMenu)}
        onPress={onDropdownPress}
        actions={[
          ...preferredSendersDisplayInfos?.filter(Boolean)?.map((profile) => ({
            id: profile.inboxId,
            title: profile.displayName || shortAddress(profile.inboxId),
            image: currentAccountInboxId === profile.inboxId ? "checkmark" : "",
          })),
          {
            displayInline: true,
            id: "new-account",
            title: translate("new_account") || "New Account",
            image: iconRegistry["new-account-card"],
          },
          {
            displayInline: true,
            id: "app-settings",
            title: translate("app_settings") || "App Settings",
            image: iconRegistry["settings"],
          },
        ]}
      >
        <HStack style={themed($rowContainer)}>
          <Text>{displayName}</Text>
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
  )
}

import { useNavigation } from "@react-navigation/native"
import React from "react"
import { ViewStyle } from "react-native"
import { Avatar } from "@/components/avatar"
import { Center } from "@/design-system/Center"
import { HeaderAction } from "@/design-system/Header/HeaderAction"
import { HStack } from "@/design-system/HStack"
import { Pressable } from "@/design-system/Pressable"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useHeader } from "@/navigation/use-header"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { AccountSwitcher } from "../authentication/components/account-switcher"

export function useConversationListScreenHeader() {
  const { theme } = useAppTheme()

  useHeader(
    {
      safeAreaEdges: ["top"],
      style: {
        paddingHorizontal: theme.spacing.sm, // In Figma, for the conversation list, the header has bigger horizontal padding
      },
      RightActionComponent: <HeaderRightActions />,
      titleComponent: <AccountSwitcher />,
    },
    [theme],
  )
}

function HeaderRightActions() {
  const navigation = useNavigation()
  const { themed } = useAppTheme()

  return (
    <HStack style={themed($rightContainer)}>
      <HeaderAction
        icon="qrcode"
        onPress={() => {
          navigation.navigate("ShareProfile")
        }}
      />
      <HeaderAction
        style={$newConversationContainer}
        icon="square.and.pencil"
        onPress={() => {
          navigation.navigate("Conversation", {
            isNew: true,
          })
        }}
      />
    </HStack>
  )
}

export function ProfileAvatar() {
  const { theme, themed } = useAppTheme()
  const navigation = useNavigation()
  const { inboxId } = useSafeCurrentSender()
  const { displayName, avatarUrl } = usePreferredDisplayInfo({ inboxId })

  return (
    <Pressable
      onPress={() => {
        navigation.navigate("Profile", {
          inboxId,
        })
      }}
      hitSlop={theme.spacing.sm}
    >
      <Center style={themed($avatarContainer)}>
        <Avatar
          uri={avatarUrl}
          name={displayName}
          sizeNumber={theme.avatarSize.sm}
        />
      </Center>
    </Pressable>
  )
}

export const $dropDownMenu: ThemedStyle<ViewStyle> = (theme) => ({
  paddingVertical: theme.spacing.sm,
  paddingRight: theme.spacing.sm,
})

export const $iconContainer: ThemedStyle<ViewStyle> = (theme) => ({
  width: theme.spacing.container.small,
  height: theme.spacing.container.small,
})

export const $rowContainer: ThemedStyle<ViewStyle> = (theme) => ({
  alignItems: "center",
  columnGap: theme.spacing.xxxs,
})

const $rightContainer: ThemedStyle<ViewStyle> = (theme) => ({
  alignItems: "center",
  columnGap: theme.spacing.xxs,
})

const $newConversationContainer: ViewStyle = {
  marginBottom: 4, // The square.and.pencil icon is not centered with the qrcode if we don't have this margin
}

export const $titleContainer: ViewStyle = {
  alignItems: "center",
}

const $avatarContainer: ThemedStyle<ViewStyle> = (theme) => ({
  padding: theme.spacing.xxs,
})

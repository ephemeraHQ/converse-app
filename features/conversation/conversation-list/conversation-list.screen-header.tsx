import { useNavigation } from "@react-navigation/native"
import React from "react"
import { ViewStyle } from "react-native"
import { HeaderAction } from "@/design-system/Header/HeaderAction"
import { HStack } from "@/design-system/HStack"
import { useHeader } from "@/navigation/use-header"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { AccountSwitcher } from "../../authentication/components/account-switcher"

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
      {/* <HeaderAction
        icon="qrcode"
        onPress={() => {
          navigation.navigate("ShareProfile")
        }}
      /> */}
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

const $rightContainer: ThemedStyle<ViewStyle> = (theme) => ({
  alignItems: "center",
  columnGap: theme.spacing.xxs,
})

const $newConversationContainer: ViewStyle = {
  marginBottom: 4, // The square.and.pencil icon is not centered with the qrcode if we don't have this margin
}

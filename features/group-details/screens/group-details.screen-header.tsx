import { useCallback } from "react"
import { Alert } from "react-native"
import { HeaderAction } from "@/design-system/Header/HeaderAction"
import { HStack } from "@/design-system/HStack"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"

export function useGroupDetailsScreenHeader() {
  const router = useRouter()
  const { theme } = useAppTheme()

  const handleBackPress = useCallback(() => {
    router.goBack()
  }, [router])

  const handleSharePress = useCallback(() => {
    // TODO: Implement share functionality
    Alert.alert("Share pressed")
  }, [])

  const handleEditPress = useCallback(() => {
    // TODO: Implement edit functionality
    Alert.alert("Edit pressed")
  }, [])

  const handleMenuPress = useCallback(() => {
    // TODO: Implement menu functionality
    Alert.alert("Menu pressed")
  }, [])

  useHeader(
    {
      safeAreaEdges: ["top"],
      title: "Info",
      leftIcon: "chevron.left",
      onLeftPress: handleBackPress,
      RightActionComponent: (
        <HStack>
          <HeaderAction icon="square.and.arrow.up" onPress={handleSharePress} />
          <HeaderAction icon="pencil" onPress={handleEditPress} />
          <HeaderAction icon="more_vert" onPress={handleMenuPress} />
        </HStack>
      ),
    },
    [handleBackPress, handleSharePress, handleEditPress, handleMenuPress, theme],
  )
}

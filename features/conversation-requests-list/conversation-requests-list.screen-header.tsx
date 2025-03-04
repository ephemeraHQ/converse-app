import { Alert } from "react-native"
import { HeaderAction } from "@/design-system/Header/HeaderAction"
import { translate } from "@/i18n"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"

export function useConversationRequestsListScreenHeader() {
  const router = useRouter()

  const handleDeleteAll = () => {
    Alert.alert(
      translate("Delete all requests"),
      translate("Would you like to delete all requests?"),
      [
        {
          text: translate("cancel"),
          style: "cancel",
        },
        {
          text: translate("delete"),
          style: "destructive",
          onPress: () => {
            // TODO: Implement delete all functionality
            console.log("Delete all requests")
            router.goBack()
          },
        },
      ],
    )
  }

  useHeader({
    safeAreaEdges: ["top"],
    onBack: () => {
      router.goBack()
    },
    title: translate("Requests"),
    RightActionComponent: <HeaderAction icon="trash" onPress={handleDeleteAll} />,
  })
}

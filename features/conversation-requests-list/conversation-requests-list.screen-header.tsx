import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { useRouter } from "@/navigation/useNavigation";

export function useConversationRequestsListScreenHeader() {
  const router = useRouter();

  useHeader({
    safeAreaEdges: ["top"],
    onBack: () => {
      router.goBack();
    },
    title: translate("message_requests"),
  });
}

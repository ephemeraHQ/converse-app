import { useChatStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useSelect } from "../data/store/storeHelpers";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";

export const useShouldShowConnecting = () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  const { localClientConnected, reconnecting } = useChatStore(
    useSelect(["localClientConnected", "reconnecting"])
  );
  return !isInternetReachable || !localClientConnected || reconnecting;
};

export const useShouldShowConnectingOrSyncing = () => {
  const { initialLoadDoneOnce, conversations } = useChatStore(
    useSelect(["initialLoadDoneOnce", "conversations"])
  );
  const shouldShowConnecting = useShouldShowConnecting();
  return (
    shouldShowConnecting ||
    (!initialLoadDoneOnce && Object.keys(conversations).length > 0)
  );
};

export default function Connecting() {
  return <ActivityIndicator />;
}

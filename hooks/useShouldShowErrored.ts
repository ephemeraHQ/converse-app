import { useChatStore } from "@data/store/accountsStore";
import { useAppStore } from "@data/store/appStore";
import { useSelect } from "@data/store/storeHelpers";

export const useShouldShowErrored = () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  const { errored } = useChatStore(useSelect(["errored"]));
  return isInternetReachable && errored;
};

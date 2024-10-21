import { useAppStore } from "@data/store/appStore";
import { useSelect } from "@data/store/storeHelpers";
import { useChatStore } from "@features/accounts/accounts.store";

export const useShouldShowErrored = () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  const { errored } = useChatStore(useSelect(["errored"]));
  return isInternetReachable && errored;
};

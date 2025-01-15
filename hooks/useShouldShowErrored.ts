import { useAppStore } from "@data/store/appStore";

export const useShouldShowErrored = () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  return !isInternetReachable;
};

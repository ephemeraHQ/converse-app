import { useAppStore } from "@/data/store/app-store";

export const useShouldShowErrored = () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  return !isInternetReachable;
};

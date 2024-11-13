import { useChatStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";

export const useTopicsData = () => {
  const { topicsData } = useChatStore(useSelect(["topicsData"]));
  return topicsData;
};

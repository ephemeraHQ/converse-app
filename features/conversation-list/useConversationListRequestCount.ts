import { useV3RequestItemCount } from "./useV3RequestItemCount";

export const useConversationListRequestCount = () => {
  const v3RequestCount = useV3RequestItemCount();
  return v3RequestCount;
};

import { useV2RequestItemCount } from "./useV2RequestItemCount";
import { useV3RequestItemCount } from "./useV3RequestItemCount";

export const useConversationListRequestCount = () => {
  const v2RequestCount = useV2RequestItemCount();
  const v3RequestCount = useV3RequestItemCount();
  return v2RequestCount + v3RequestCount;
};

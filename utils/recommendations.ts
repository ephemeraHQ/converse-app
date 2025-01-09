import { findFrensByInboxId } from "./api";
import { getRecommendationsStore } from "@/data/store/accountsStore";

export const refreshRecommendationsForInboxId = async (
  inboxIdToRefresh: string | undefined
) => {
  if (!inboxIdToRefresh) {
    return;
  }
  const frens = await findFrensByInboxId({
    accountInboxId: inboxIdToRefresh,
  });
  const now = new Date().getTime();
  getRecommendationsStore({ inboxId: inboxIdToRefresh })
    .getState()
    .setRecommendations(frens, now);
};

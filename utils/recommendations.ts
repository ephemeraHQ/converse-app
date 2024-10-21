import { getRecommendationsStore } from "@features/accounts/accounts.store";

import { findFrens } from "./api";

export const refreshRecommendationsForAccount = async (account: string) => {
  const frens = await findFrens(account);
  const now = new Date().getTime();
  getRecommendationsStore(account).getState().setRecommendations(frens, now);
};

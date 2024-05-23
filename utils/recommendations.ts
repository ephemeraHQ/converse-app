import { getRecommendationsStore } from "../data/store/accountsStore";
import { findFrens } from "./api";

export const refreshRecommendationsForAccount = async (account: string) => {
  const frens = await findFrens(account);
  const now = new Date().getTime();
  getRecommendationsStore(account).getState().setRecommendations(frens, now);
};

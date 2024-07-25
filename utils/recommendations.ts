import { findFrens } from "./api";
import { getRecommendationsStore } from "../data/store/accountsStore";

export const refreshRecommendationsForAccount = async (account: string) => {
  const frens = await findFrens(account);
  const now = new Date().getTime();
  getRecommendationsStore(account).getState().setRecommendations(frens, now);
};

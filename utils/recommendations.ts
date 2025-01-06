import { findFrensByEthereumAddress } from "./api";
import { getRecommendationsStore } from "../data/store/accountsStore";

export const refreshRecommendationsForAccount = async (account: string) => {
  const frens = await findFrensByEthereumAddress(account);
  const now = new Date().getTime();
  getRecommendationsStore(account).getState().setRecommendations(frens, now);
};

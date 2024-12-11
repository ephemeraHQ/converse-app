import { subscribedOnceByAccount } from "./subscribedOnceByAccount";
import { subscribingByAccount } from "./subscribingByAccount";

export const deleteSubscribedTopics = (account: string) => {
  if (account in subscribedOnceByAccount) {
    delete subscribedOnceByAccount[account];
  }
  if (account in subscribingByAccount) {
    delete subscribingByAccount[account];
  }
};

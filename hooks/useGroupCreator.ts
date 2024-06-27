import { useGroupQuery } from "@queries/useGroupQuery";

import { currentAccount } from "../data/store/accountsStore";

export const useGroupCreator = (topic: string) => {
  const account = currentAccount();
  const { data, isLoading, isError } = useGroupQuery(account, topic);

  return {
    groupCreator: data?.creatorInboxId,
    isLoading,
    isError,
  };
};

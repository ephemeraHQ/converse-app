import { useGroupQuery } from "@queries/useGroupQuery";

import { currentAccount } from "../data/store/accountsStore";

export const useGroupId = (topic: string) => {
  const account = currentAccount();
  const { data, isLoading, isError } = useGroupQuery(account, topic);

  return {
    groupId: data?.id,
    isLoading,
    isError,
  };
};

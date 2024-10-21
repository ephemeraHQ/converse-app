import { currentAccount } from "@features/accounts/accounts.store";
import { useGroupQuery } from "@queries/useGroupQuery";

export const useGroupId = (topic: string) => {
  const account = currentAccount();
  const { data, isLoading, isError } = useGroupQuery(account, topic);

  return {
    groupId: data?.id,
    isLoading,
    isError,
  };
};

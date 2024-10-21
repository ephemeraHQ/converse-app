import { currentAccount } from "@features/accounts/accounts.store";
import { useGroupQuery } from "@queries/useGroupQuery";

export const useGroupCreator = (topic: string) => {
  const account = currentAccount();
  const { data, isLoading, isError } = useGroupQuery(account, topic);

  return {
    groupCreator: data?.creatorInboxId,
    isLoading,
    isError,
  };
};

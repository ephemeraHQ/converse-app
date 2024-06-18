import { currentAccount } from "../data/store/accountsStore";
import { useGroupNameMutation } from "../queries/useGroupNameMutation";
import { useGroupNameQuery } from "../queries/useGroupNameQuery";

export const useGroupName = (topic: string) => {
  const account = currentAccount();
  const { data, isLoading, isError } = useGroupNameQuery(account, topic);
  const { mutateAsync } = useGroupNameMutation(account, topic);

  return {
    groupName: data,
    isLoading,
    isError,
    setGroupName: mutateAsync,
  };
};

import { currentAccount } from "@features/accounts/accounts.store";

import { useGroupDescriptionMutation } from "../queries/useGroupDescriptionMutation";
import { useGroupDescriptionQuery } from "../queries/useGroupDescriptionQuery";

export const useGroupDescription = (topic: string) => {
  const account = currentAccount();
  const { data, isLoading, isError } = useGroupDescriptionQuery(account, topic);
  const { mutateAsync } = useGroupDescriptionMutation(account, topic);

  return {
    groupDescription: data,
    isLoading,
    isError,
    setGroupDescription: mutateAsync,
  };
};

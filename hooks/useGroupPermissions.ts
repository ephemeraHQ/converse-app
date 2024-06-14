import { currentAccount } from "../data/store/accountsStore";
import { useGroupPermissionsQuery } from "../queries/useGroupPermissionsQuery";

export const useGroupPermissions = (topic: string) => {
  const account = currentAccount();
  const {
    data: permissions,
    isLoading,
    isError,
  } = useGroupPermissionsQuery(account, topic);

  return {
    permissions,
    isLoading,
    isError,
  };
};

import { usePreferredNames } from "@/hooks/usePreferredNames";
import { useAccountsList } from "@/features/authentication/account.store";

export const useAccountsProfiles = () => {
  const accounts = useAccountsList();

  const accountNames = usePreferredNames(accounts);

  return accountNames;
};

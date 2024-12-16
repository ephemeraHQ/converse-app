import { useAccountsList } from "../data/store/accountsStore";
import { usePreferredNames } from "@/hooks/usePreferredNames";

export const useAccountsProfiles = () => {
  const accounts = useAccountsList();

  const accountNames = usePreferredNames(accounts);

  return accountNames;
};

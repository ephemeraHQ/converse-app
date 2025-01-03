import { useInboxIdsList } from "../data/store/accountsStore";
import { usePreferredNames } from "@/hooks/usePreferredNames";

export const useAccountsProfiles = () => {
  const accounts = useInboxIdsList();

  const accountNames = usePreferredNames(accounts);

  return accountNames;
};

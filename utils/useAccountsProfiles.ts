import { useAccountsList } from "../features/multi-inbox/multi-inbox.store";
import { usePreferredNames } from "@/hooks/usePreferredNames";

export const useAccountsProfiles = () => {
  const accounts = useAccountsList();

  const accountNames = usePreferredNames(accounts);

  return accountNames;
};

import { usePreferredNames } from "@/hooks/usePreferredNames";
import { useAccountsList } from "@/features/multi-inbox/multi-inbox.store";

export const useAccountsProfiles = () => {
  const accounts = useAccountsList();

  const accountNames = usePreferredNames(accounts);

  return accountNames;
};

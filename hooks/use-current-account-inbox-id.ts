import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import {
  getInboxIdFromQueryData,
  prefetchInboxIdQuery,
  useInboxIdQuery,
} from "../queries/use-inbox-id-query";

export function useCurrentAccountInboxId() {
  const currentAccount = useCurrentAccount()!;
  return useInboxIdQuery({ account: currentAccount });
}

export function getCurrentUserAccountInboxId() {
  const currentAccount = getCurrentAccount()!;
  return getInboxIdFromQueryData({ account: currentAccount });
}

export function prefetchCurrentUserAccountInboxId() {
  const currentAccount = getCurrentAccount()!;
  return prefetchInboxIdQuery({ account: currentAccount });
}

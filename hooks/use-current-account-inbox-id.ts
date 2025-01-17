import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { InboxId } from "@xmtp/react-native-sdk";
import {
  getInboxIdFromQueryData,
  prefetchInboxIdQuery,
  useInboxIdQuery,
} from "../queries/use-inbox-id-query";

export function useCurrentAccountInboxId() {
  const currentAccount = useCurrentAccount()!;
  return useInboxIdQuery({ account: currentAccount });
}

export function getCurrentAccountInboxId() {
  const currentAccount = getCurrentAccount()!;
  return getInboxIdFromQueryData({ account: currentAccount });
}

export function prefetchCurrentAccountInboxId() {
  const currentAccount = getCurrentAccount()!;
  return prefetchInboxIdQuery({ account: currentAccount });
}

export function isCurrentAccountInboxId(inboxId: InboxId) {
  const currentAccountInboxId = getCurrentAccountInboxId();
  return currentAccountInboxId?.toLowerCase() === inboxId.toLowerCase();
}

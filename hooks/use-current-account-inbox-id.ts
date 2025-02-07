import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/features/multi-inbox/multi-inbox.store";
import { InboxId } from "@xmtp/react-native-sdk";
import {
  getInboxIdFromQueryData,
  useInboxIdQuery,
} from "../queries/inbox-id-query";

export function useCurrentAccountInboxId() {
  const currentAccount = useCurrentAccount()!;
  return useInboxIdQuery({ account: currentAccount });
}

export function useSafeCurrentAccountInboxId() {
  const { data } = useCurrentAccountInboxId();
  return data!;
}

export function getCurrentAccountInboxId() {
  const currentAccount = getCurrentAccount()!;
  return getInboxIdFromQueryData({ account: currentAccount });
}

export function getCurrentAccountInboxIdSafe() {
  const currentAccount = getCurrentAccount()!;
  return getInboxIdFromQueryData({ account: currentAccount })!;
}

export function isCurrentAccountInboxId(inboxId: InboxId) {
  const currentAccountInboxId = getCurrentAccountInboxId();
  return currentAccountInboxId?.toLowerCase() === inboxId.toLowerCase();
}

import { RolledUpReactions } from "../conversation-message-reactions.types";
import {
  resetMessageReactionsStore,
  useMessageReactionsStore,
  IMessageReactionsStore,
} from "./conversation-message-reaction-drawer.store";

export function openMessageReactionsDrawer(
  rolledUpReactions: RolledUpReactions
) {
  const store = useMessageReactionsStore.getState();
  store.setRolledUpReactions(rolledUpReactions);
}

export function closeMessageReactionsDrawer(arg?: { resetStore?: boolean }) {
  const { resetStore = true } = arg ?? {};
  if (resetStore) {
    resetMessageReactionsStore();
  }
}

export function resetMessageReactionsDrawer() {
  resetMessageReactionsStore();
}

export function useMessageReactionsRolledUpReactions() {
  return useMessageReactionsStore((state) => state.rolledUpReactions);
}

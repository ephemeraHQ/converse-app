import { RolledUpReactions } from "../conversation-message-reactions.types";
import {
  resetMessageReactionsStore,
  useMessageReactionsStore,
  IMessageReactionsStore,
} from "./conversation-message-reaction-drawer.store";

export function openMessageReactionsDrawer(
  rolledUpReactions: RolledUpReactions
) {
  const store = useMessageReactionsStore.getState() as IMessageReactionsStore;
  store.setRolledUpReactions(rolledUpReactions);
  store.setIsVisible(true);
}

export function closeMessageReactionsDrawer(arg?: { resetStore?: boolean }) {
  const { resetStore = true } = arg ?? {};
  const store = useMessageReactionsStore.getState() as IMessageReactionsStore;
  store.setIsVisible(false);
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

export function useMessageReactionsDrawerVisible() {
  return useMessageReactionsStore((state) => state.isVisible);
}

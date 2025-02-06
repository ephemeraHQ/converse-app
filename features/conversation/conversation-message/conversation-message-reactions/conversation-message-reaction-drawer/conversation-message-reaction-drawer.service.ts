import {
  resetMessageReactionsStore,
  useMessageReactionsStore,
} from "./conversation-message-reaction-drawer.store";
import { RolledUpReactions } from "../conversation-message-reactions.types";

export function openMessageReactionsDrawer(reactions: RolledUpReactions) {
  useMessageReactionsStore.getState().setRolledUpReactions(reactions);
}

export function closeMessageReactionsDrawer() {
  resetMessageReactionsStore();
}

export function useMessageReactionsRolledUpReactions() {
  return useMessageReactionsStore((state) => state.rolledUpReactions);
}

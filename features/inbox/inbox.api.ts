import { InboxId } from "@xmtp/react-native-sdk";

export function useInboxName({ inboxId }: { inboxId: InboxId }) {
  return { data: `todo username inbox lookup ${inboxId}`, isLoading: false };
}

export function useInboxAvatar({ inboxId }: { inboxId: InboxId }) {
  return { data: `todo avatar uri ${inboxId}`, isLoading: false };
}

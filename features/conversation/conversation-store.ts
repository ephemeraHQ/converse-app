import {
  ConversationTopic,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { create } from "zustand";

export type IConversationStore = {
  topic: ConversationTopic | undefined;
  peerAddress: string | undefined;
  uploadedRemoteAttachment: RemoteAttachmentContent | null;
};

export const useConversationStore = create<IConversationStore>(() => ({
  topic: undefined,
  peerAddress: undefined,
  uploadedRemoteAttachment: null,
}));

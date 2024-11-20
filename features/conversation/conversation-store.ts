import {
  ConversationTopic,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { create } from "zustand";

export type IConversationStore = {
  topic: ConversationTopic;
  uploadedRemoteAttachment: RemoteAttachmentContent | null;
};

export const useConversationStore = create<IConversationStore>((set, get) => ({
  topic: "" as ConversationTopic,
  uploadedRemoteAttachment: null,
}));

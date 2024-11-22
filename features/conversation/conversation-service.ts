import { getCurrentAccount } from "@data/store/accountsStore";
import { MessageAttachmentStatus } from "@data/store/chatStore";
import { getConversationMessages } from "@queries/useConversationMessages";
import {
  createFolderForMessage,
  getMessageAttachmentLocalPath,
  saveLocalAttachmentMetaData,
} from "@utils/attachment/attachment.utils";
import { moveFileAndReplace } from "@utils/fileSystem";
import {
  ConversationTopic,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import * as ImagePicker from "expo-image-picker";
import { v4 as uuidv4 } from "uuid";
import {
  IComposerMediaPreview,
  getCurrentConversationPersistedStore,
  useCurrentConversationPersistedStoreState,
} from "./conversation-persisted-stores";
import { useConversationStore } from "./conversation-store";
import { getLocalAttachment } from "@utils/attachment/handleAttachment";

export function initializeCurrentConversation(args: {
  topic: ConversationTopic | undefined;
  peerAddress: string | undefined;
  inputValue: string;
}) {
  const { topic, peerAddress, inputValue } = args;
  useConversationStore.setState({ topic, peerAddress });
  setCurrentConversationInputValue(inputValue);
}

export function resetCurrentConversation() {
  useConversationStore.setState({ topic: "" as ConversationTopic });
}

export function updateNewConversation(newTopic: ConversationTopic) {
  setCurrentConversationInputValue("");
  useConversationStore.setState({ topic: newTopic, peerAddress: undefined });
}

export function getComposerMediaPreview() {
  const conversationStore = getCurrentConversationPersistedStore();
  return conversationStore.getState().composerMediaPreview;
}

export function setComposerMediaPreview(mediaPreview: IComposerMediaPreview) {
  const conversationStore = getCurrentConversationPersistedStore();
  conversationStore.setState((state) => ({
    ...state,
    composerMediaPreview: mediaPreview,
  }));
}

export function setComposerMediaPreviewStatus(status: MessageAttachmentStatus) {
  const conversationStore = getCurrentConversationPersistedStore();
  conversationStore.setState((state) => ({
    ...state,
    composerMediaPreview: { ...state.composerMediaPreview!, status },
  }));
}

export function handleAttachmentSelected(asset: ImagePicker.ImagePickerAsset) {
  const conversationStore = getCurrentConversationPersistedStore();
  conversationStore.setState((state) => ({
    ...state,
    mediaURI: asset.uri,
    status: "picked",
    dimensions: {
      height: asset.height,
      width: asset.width,
    },
  }));
}

export async function saveAttachmentLocally() {
  const mediaPreview = getComposerMediaPreview();

  if (!mediaPreview) {
    throw new Error("No media preview found");
  }

  const messageId = uuidv4();

  await createFolderForMessage(messageId);

  const filename = mediaPreview.mediaURI.split("/").pop() || `${uuidv4()}`;

  const attachmentLocalPath = getMessageAttachmentLocalPath(
    messageId,
    filename
  );

  await moveFileAndReplace(mediaPreview.mediaURI, attachmentLocalPath);

  await saveLocalAttachmentMetaData({
    messageId,
    filename,
    mimeType: mediaPreview.mimeType || undefined,
  });
}

export function useReplyToMessageId() {
  return useCurrentConversationPersistedStoreState(
    (state) => state.replyingToMessageId
  );
}

export function setCurrentConversationReplyToMessageId(
  replyingToMessageId: string | null
) {
  const conversationStore = getCurrentConversationPersistedStore();
  conversationStore.setState((state) => ({
    ...state,
    replyingToMessageId,
  }));
}

export function setCurrentConversationInputValue(inputValue: string) {
  const conversationStore = getCurrentConversationPersistedStore();
  conversationStore.setState((state) => ({
    ...state,
    inputValue,
  }));
}

export function waitUntilMediaPreviewIsUploaded() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkStatus = () => {
      const mediaPreview = getComposerMediaPreview();
      if (!mediaPreview?.status) {
        resolve(true);
        return;
      }
      if (mediaPreview.status === "uploaded") {
        resolve(true);
        return;
      }
      if (Date.now() - startTime > 10000) {
        reject(new Error("Media upload timeout after 10 seconds"));
        return;
      }
      setTimeout(checkStatus, 200);
    };
    checkStatus();
  });
}

export function listenToComposerInputValueChange(
  callback: (value: string, previousValue: string) => void
) {
  const conversationStore = getCurrentConversationPersistedStore();
  conversationStore.subscribe((state) => state.inputValue, callback);
}

export function getCurrentConversationInputValue() {
  const conversationStore = getCurrentConversationPersistedStore();
  return conversationStore.getState().inputValue;
}

export function useCurrentConversationInputValue() {
  return useCurrentConversationPersistedStoreState((state) => state.inputValue);
}

export function setUploadedRemoteAttachment(
  uploadedRemoteAttachment: RemoteAttachmentContent
) {
  useConversationStore.setState((state) => ({
    ...state,
    uploadedRemoteAttachment,
  }));
}

export function getUploadedRemoteAttachment() {
  return useConversationStore.getState().uploadedRemoteAttachment;
}

export function resetUploadedRemoteAttachment() {
  useConversationStore.setState({
    uploadedRemoteAttachment: null,
  });
}

export function resetComposerMediaPreview() {
  const conversationStore = getCurrentConversationPersistedStore();
  conversationStore.setState({
    composerMediaPreview: null,
  });
}

export function getCurrentConversationReplyToMessageId() {
  const conversationStore = getCurrentConversationPersistedStore();
  return conversationStore.getState().replyingToMessageId;
}

export function useConversationCurrentTopic() {
  return useConversationStore((state) => state.topic);
}

export function useConversationCurrentPeerAddress() {
  return useConversationStore((state) => state.peerAddress);
}

export function getCurrentConversationTopic() {
  return useConversationStore.getState().topic;
}

export function useConversationComposerMediaPreview() {
  return useCurrentConversationPersistedStoreState(
    (state) => state.composerMediaPreview
  );
}

export function getCurrentConversationMessages() {
  const currentAccount = getCurrentAccount()!;
  const topic = getCurrentConversationTopic();
  if (!topic) {
    return {
      byId: {},
      ids: [],
    };
  }
  return getConversationMessages(currentAccount, topic);
}

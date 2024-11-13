import mmkv from "@utils/mmkv";

export const DRAFT_MESSAGE_KEY = "draftMessage";

export const getDraftMessage = (topic: string) => {
  return mmkv.getString(`${DRAFT_MESSAGE_KEY}-${topic}`);
};

export const setDraftMessage = (topic: string, message: string) => {
  mmkv.delete(`${DRAFT_MESSAGE_KEY}-${topic}`);
  mmkv.set(`${DRAFT_MESSAGE_KEY}-${topic}`, message);
};

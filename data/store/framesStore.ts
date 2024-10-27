import isDeepEqual from "fast-deep-equal";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { FrameWithType } from "../../utils/frames";
import { zustandMMKVStorage } from "../../utils/mmkv";
import { pick } from "../../utils/objects";

type FramesStoreType = {
  frames: {
    [frameUrl: string]: FrameWithType;
  };
  messageFramesMap: {
    [messageId: string]: FrameWithType[];
  };
  setFrames: (
    messageId: string,
    framesToSet: { [frameUrl: string]: FrameWithType }
  ) => void;
  getFramesForURLs: (urls: string[]) => FrameWithType[];
  setMessageFramesMap: (messageId: string, framesUrls: FrameWithType[]) => void;
};

export const useFramesStore = create<FramesStoreType>()(
  persist(
    (set, get) => ({
      frames: {},
      messageFramesMap: {},
      setFrames: (
        messageId: string,
        framesToSet: { [frameUrl: string]: FrameWithType }
      ) =>
        set((state) => {
          const existingFrames = pick(state.frames, Object.keys(framesToSet));

          if (isDeepEqual(existingFrames, framesToSet)) return {};
          return {
            ...state,
            frames: { ...state.frames, ...framesToSet },
            messageFramesMap: {
              ...state.messageFramesMap,
              [messageId]: Object.values(framesToSet),
            },
          };
        }),
      getFramesForURLs: (urls: string[]) => {
        const framesToReturn: FrameWithType[] = [];
        const allFrames = get().frames;
        urls.forEach((url) => {
          const frame = allFrames[url.toLowerCase()] || allFrames[url];
          if (frame) {
            framesToReturn.push(frame);
          }
        });
        return framesToReturn;
      },
      setMessageFramesMap: (messageId: string, frames: FrameWithType[]) =>
        set((state) => {
          return {
            ...state,
            messageFramesMap: {
              ...state.messageFramesMap,
              [messageId]: frames,
            },
          };
        }),
    }),
    {
      name: `store-frames`,
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

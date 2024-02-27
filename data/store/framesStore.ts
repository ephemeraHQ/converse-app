import isDeepEqual from "fast-deep-equal";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { FrameToDisplay } from "../../utils/frames";
import { zustandMMKVStorage } from "../../utils/mmkv";
import { pick } from "../../utils/objects";

type FramesStoreType = {
  frames: {
    [frameUrl: string]: FrameToDisplay;
  };
  setFrames: (framesToSet: { [frameUrl: string]: FrameToDisplay }) => void;
  getFramesForURLs: (urls: string[]) => FrameToDisplay[];
};

export const useFramesStore = create<FramesStoreType>()(
  persist(
    (set, get) => ({
      frames: {},
      setFrames: (framesToSet: { [frameUrl: string]: FrameToDisplay }) =>
        set((state) => {
          const existingFrames = pick(state.frames, Object.keys(framesToSet));
          if (isDeepEqual(existingFrames, framesToSet)) return {};
          return { frames: { ...state.frames, ...framesToSet } };
        }),
      getFramesForURLs: (urls: string[]) => {
        const framesToReturn: FrameToDisplay[] = [];
        const allFrames = get().frames;
        urls.forEach((url) => {
          const frame = allFrames[url];
          if (frame) {
            framesToReturn.push(frame);
          }
        });
        return framesToReturn;
      },
    }),
    {
      name: `store-frames`,
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

import { ISnackbar } from "@/components/snackbar/snackbar.types";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type ISnackBarStore = {
  snackbars: ISnackbar[];
  showSnackbar: (snackbar: ISnackbar) => void;
  clearAllSnackbars: () => void;
};

export const useSnackBarStore = create<ISnackBarStore>()(
  subscribeWithSelector((set) => ({
    snackbars: [],
    showSnackbar: (snackbar) => {
      set((state) => ({
        snackbars: [...state.snackbars, snackbar],
      }));
    },
    clearAllSnackbars: () => {
      set({ snackbars: [] });
    },
  }))
);

// Initialize store
useSnackBarStore.getState();

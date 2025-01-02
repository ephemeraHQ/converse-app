import {
  ActionSheetOptions,
  ActionSheetProps,
  useActionSheet,
} from "@expo/react-native-action-sheet";

import { useAppStore } from "../../data/store/appStore";

export let showActionSheetWithOptions: ActionSheetProps["showActionSheetWithOptions"];

export default function ActionSheetStateHandler() {
  const { showActionSheetWithOptions: _showActionSheetWithOptions } =
    useActionSheet();
  showActionSheetWithOptions = (
    options: ActionSheetOptions,
    callback: (i?: number | undefined) => void | Promise<void>
  ) => {
    if (options.options.length === 1) {
      callback(0);
      return;
    }
    useAppStore.getState().setActionSheetShown(true);
    _showActionSheetWithOptions(options, (i?: number | undefined) => {
      useAppStore.getState().setActionSheetShown(false);
      if (callback) {
        callback(i);
      }
    });
  };
  return null;
}

import { useCallback, useEffect } from "react";

import { useAppStore } from "../../data/store/appStore";
import {
  MessageActionSheetOptions,
  useMessageActionSheet,
} from "../Chat/Message/MessageActionSheet";

export let showActionSheetWithOptions: (
  options: MessageActionSheetOptions,
  callback: (i?: number) => void | Promise<void>
) => void;

export default function ActionSheetStateHandler() {
  const {
    showActionSheetWithOptions: _showActionSheetWithOptions,
    actionSheet,
  } = useMessageActionSheet();

  const wrappedShowActionSheetWithOptions = useCallback(
    (
      options: MessageActionSheetOptions,
      callback: (i?: number) => void | Promise<void>
    ) => {
      useAppStore.getState().setActionSheetShown(true);
      _showActionSheetWithOptions(options, (i?: number) => {
        useAppStore.getState().setActionSheetShown(false);
        if (callback) {
          callback(i);
        }
      });
    },
    [_showActionSheetWithOptions]
  );

  useEffect(() => {
    showActionSheetWithOptions = wrappedShowActionSheetWithOptions;
  }, [wrappedShowActionSheetWithOptions]);

  return actionSheet;
}

import {
  ActionSheetOptions,
  ActionSheetProps,
  useActionSheet,
} from "@expo/react-native-action-sheet";
import { useCallback, useContext } from "react";

import { AppDispatchTypes } from "../../data/store/appReducer";
import { AppContext } from "../../data/store/context";

export let showActionSheetWithOptions: ActionSheetProps["showActionSheetWithOptions"];

export default function ActionSheetStateHandler() {
  const { dispatch } = useContext(AppContext);

  const { showActionSheetWithOptions: _showActionSheetWithOptions } =
    useActionSheet();
  showActionSheetWithOptions = useCallback(
    (
      options: ActionSheetOptions,
      callback: (i?: number | undefined) => void | Promise<void>
    ) => {
      dispatch({
        type: AppDispatchTypes.AppShowingActionSheet,
        payload: { showing: true },
      });
      const newCallback = (i?: number | undefined) => {
        dispatch({
          type: AppDispatchTypes.AppShowingActionSheet,
          payload: { showing: false },
        });
        return callback(i);
      };
      setTimeout(() => {
        _showActionSheetWithOptions(options, newCallback);
      }, 10);
    },
    [_showActionSheetWithOptions, dispatch]
  );
  return null;
}

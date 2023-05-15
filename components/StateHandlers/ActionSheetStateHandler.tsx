import {
  ActionSheetProps,
  useActionSheet,
} from "@expo/react-native-action-sheet";

export let showActionSheetWithOptions: ActionSheetProps["showActionSheetWithOptions"];

export default function ActionSheetStateHandler() {
  const { showActionSheetWithOptions: _showActionSheetWithOptions } =
    useActionSheet();
  showActionSheetWithOptions = _showActionSheetWithOptions;
  return null;
}

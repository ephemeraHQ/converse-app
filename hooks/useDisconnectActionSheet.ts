import { actionSheetColors } from "@styles/colors";
import { useCallback } from "react";
import { ColorSchemeName } from "react-native";
import { showActionSheetWithOptions } from "../components/StateHandlers/ActionSheetStateHandler";
import { useLogout } from "@/features/onboarding/contexts/logout.context";
export const useDisconnectActionSheet = () => {
  const logout = useLogout();

  return useCallback(
    (colorScheme: ColorSchemeName) => {
      showActionSheetWithOptions(
        {
          options: ["Log out", "Cancel"],
          title: "Disconnect this account",
          message: "Disconnect this account",
          cancelButtonIndex: 1,
          destructiveButtonIndex: [0],
          ...actionSheetColors(colorScheme),
        },
        (selectedIndex?: number) => {
          if (selectedIndex === 0) {
            logout();
          }
        }
      );
    },
    [logout]
  );
};

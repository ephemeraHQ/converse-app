import { translate } from "@i18n";
import { actionSheetColors } from "@styles/colors";
import { useCallback } from "react";
import { ColorSchemeName, Platform } from "react-native";

import { showActionSheetWithOptions } from "../components/StateHandlers/ActionSheetStateHandler";
import {
  useSettingsStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { useLogoutFromConverse } from "../utils/logout";

export const useDisconnectActionSheet = () => {
  const account = useAccountsStore((s) => s.currentAccount);
  const logout = useLogoutFromConverse(account);
  const { ephemeralAccount } = useSettingsStore((s) => ({
    ephemeralAccount: s.ephemeralAccount,
  }));

  return useCallback(
    async (colorScheme: ColorSchemeName) => {
      if (Platform.OS === "web") {
        // Fixes double action sheet on web
        await new Promise((r) => setTimeout(r, 100));
      }
      const methods: Record<string, () => void> = {
        [translate("disconnect_delete_local_data")]: () => logout(true),
        [translate("cancel")]: () => {},
      };
      if (!ephemeralAccount) {
        methods[translate("disconnect")] = () => logout(false);
      }

      const options = Object.keys(methods);
      showActionSheetWithOptions(
        {
          options,
          title: !ephemeralAccount ? translate("disconnect_this_account") : "",
          message: !ephemeralAccount
            ? translate("disconnect_account_description")
            : "",
          cancelButtonIndex: options.indexOf(translate("cancel")),
          destructiveButtonIndex: [1],
          ...actionSheetColors(colorScheme),
        },
        (selectedIndex?: number) => {
          if (selectedIndex === undefined) return;
          const method = (methods as any)[options[selectedIndex]];
          if (method) {
            method();
          }
        }
      );
    },
    [logout, ephemeralAccount]
  );
};

export const showDeleteAccountActionSheet = async (
  colorScheme: ColorSchemeName,
  logout: (deleteLocalChats: boolean) => void,
  ephemeralAccount: boolean
) => {};

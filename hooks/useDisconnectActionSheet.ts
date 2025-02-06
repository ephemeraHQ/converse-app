import { logoutAccount } from "@/utils/logout";
import { translate } from "@i18n";
import { actionSheetColors } from "@styles/colors";
import { useCallback } from "react";
import { ColorSchemeName } from "react-native";
import { showActionSheetWithOptions } from "../components/StateHandlers/ActionSheetStateHandler";
import {
  useAccountsStore,
  useSettingsStore,
} from "../features/multi-inbox/multi-inbox.store";
import { usePrivy } from "@privy-io/expo";

export const useDisconnectActionSheet = (account?: string) => {
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const { ephemeralAccount } = useSettingsStore((s) => ({
    ephemeralAccount: s.ephemeralAccount,
  }));
  const privy = usePrivy();

  return useCallback(
    async (colorScheme: ColorSchemeName) => {
      const methods: Record<string, () => void> = {
        [translate("log_out")]: () => {
          if (privy.user) {
            privy.logout();
          }
          logoutAccount({ account: currentAccount });
        },
        [translate("cancel")]: () => {},
      };

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
    [ephemeralAccount, currentAccount, privy]
  );
};

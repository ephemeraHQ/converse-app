import { translate } from "@i18n";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  actionSheetColors,
  dangerColor,
  primaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import React, { useCallback } from "react";
import {
  Keyboard,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import { invalidateProfileSocialsQuery } from "@/queries/useProfileSocialsQuery";
import { useAccountsStore } from "../features/multi-inbox/multi-inbox.store";
import { useAppStore } from "../data/store/appStore";
import { useSelect } from "../data/store/storeHelpers";
import { useRouter } from "../navigation/useNavigation";
import { navigate } from "../utils/navigation";
import Picto from "./Picto/Picto";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { TableViewPicto } from "./TableView/TableViewImage";
import { useLogout } from "@/utils/logout";

type Props = {
  account: string;
};

export default function AccountSettingsButton({ account }: Props) {
  const router = useRouter();

  const { notificationsPermissionStatus, isInternetReachable } = useAppStore(
    useSelect([
      "setNotificationsPermissionStatus",
      "notificationsPermissionStatus",
      "isInternetReachable",
    ])
  );

  const { setCurrentAccount } = useAccountsStore(
    useSelect(["setCurrentAccount"])
  );

  const colorScheme = useColorScheme();
  const { logout } = useLogout();

  const onPress = useCallback(() => {
    Keyboard.dismiss();

    const methods = {
      ["Your profile page"]: async () => {
        if (account) {
          invalidateProfileSocialsQuery(account);
          setCurrentAccount({ ethereumAddress: account });

          router.navigate("Chats");
          navigate("Profile", {
            address: account,
          });
        }
      },
      ["Copy wallet address"]: () => {
        Clipboard.setString(account || "");
      },
      ["Turn on notifications"]: () => {
        // TODO
      },
      ["Logout"]: () => {
        logout();
      },
      ["Cancel"]: () => {},
    };

    const options = Object.keys(methods);
    const icons = [];
    if (isInternetReachable) {
      icons.push(
        <Picto
          style={{
            width: PictoSizes.tableViewImage,
            height: PictoSizes.tableViewImage,
          }}
          size={PictoSizes.tableViewImage}
          picto="exclamationmark.triangle"
          color={dangerColor(colorScheme)}
        />
      );
    }
    if (notificationsPermissionStatus === "granted") {
      options.splice(options.indexOf(translate("turn_on_notifications")), 1);
    }

    showActionSheetWithOptions(
      {
        options,
        icons,
        destructiveButtonIndex: options.indexOf(
          translate("disconnect_this_account")
        ),
        cancelButtonIndex: options.indexOf(translate("cancel")),
        title: account || undefined,
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
  }, [
    router,
    account,
    isInternetReachable,
    notificationsPermissionStatus,
    colorScheme,
    setCurrentAccount,
    logout,
  ]);

  return Platform.OS === "android" ? (
    <TouchableOpacity onPress={onPress}>
      <Picto
        picto="more_vert"
        size={PictoSizes.accoutSettings}
        color={textSecondaryColor(colorScheme)}
      />
    </TouchableOpacity>
  ) : (
    <TableViewPicto
      symbol="info.circle"
      color={primaryColor(colorScheme)}
      onPress={onPress}
    />
  );
}

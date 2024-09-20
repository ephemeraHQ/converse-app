import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import { translate } from "@i18n";
import { Consent } from "@queries/useGroupConsentQuery";
import { actionSheetColors } from "@styles/colors";
import { ColorSchemeName } from "react-native";

type GroupAction = {
  includeAddedBy: boolean;
  includeCreator: boolean;
};

type GroupActionHandler = (options: GroupAction) => void;

export const groupRemoveRestoreHandler = (
  consent: Consent | undefined,
  colorScheme: ColorSchemeName,
  groupName: string | undefined,
  allowGroup: GroupActionHandler,
  blockGroup: GroupActionHandler
) => {
  return (callback: (success: boolean) => void) => {
    const showOptions = (
      options: string[],
      title: string,
      actions: (() => void)[]
    ) => {
      showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: consent === "denied" ? undefined : [0, 1],
          title,
          ...actionSheetColors(colorScheme),
        },
        async (selectedIndex?: number) => {
          if (selectedIndex !== undefined && selectedIndex < actions.length) {
            actions[selectedIndex]();
            callback(true);
          } else {
            callback(false);
          }
        }
      );
    };

    if (consent === "denied") {
      showOptions(
        [
          translate("restore"),
          translate("restore_and_unblock_inviter"),
          translate("cancel"),
        ],
        `${translate("restore")} ${groupName}?`,
        [
          () => allowGroup({ includeAddedBy: false, includeCreator: false }),
          () => allowGroup({ includeAddedBy: true, includeCreator: false }),
        ]
      );
    } else {
      showOptions(
        [
          translate("remove"),
          translate("remove_and_block_inviter"),
          translate("cancel"),
        ],
        `${translate("remove")} ${groupName}?`,
        [
          () => blockGroup({ includeAddedBy: false, includeCreator: false }),
          () => blockGroup({ includeAddedBy: true, includeCreator: false }),
        ]
      );
    }
  };
};

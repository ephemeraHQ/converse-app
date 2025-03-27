import { translate } from "@i18n"
import { ConsentState } from "@xmtp/react-native-sdk"
import { ColorSchemeName } from "react-native"
import { showActionSheet } from "@/components/action-sheet"

type GroupAction = {
  includeAddedBy: boolean
  includeCreator: boolean
}

type GroupActionHandler = (options: GroupAction) => void

export const groupRemoveRestoreHandler = (
  consent: ConsentState | undefined,
  colorScheme: ColorSchemeName,
  groupName: string | undefined,
  allowGroup: GroupActionHandler,
  blockGroup: GroupActionHandler,
) => {
  return (callback: (success: boolean) => void) => {
    const showOptions = (options: string[], title: string, actions: (() => void)[]) => {
      showActionSheet({
        options: {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: consent === "denied" ? undefined : [0, 1],
          title,
        },
        callback: (selectedIndex?: number) => {
          if (selectedIndex !== undefined && selectedIndex < actions.length) {
            actions[selectedIndex]()
            callback(true)
          } else {
            callback(false)
          }
        },
      })
    }

    if (consent === "denied") {
      showOptions(
        [translate("restore"), translate("restore_and_unblock_inviter"), translate("Cancel")],
        `${translate("restore")} ${groupName}?`,
        [
          () => allowGroup({ includeAddedBy: false, includeCreator: false }),
          () => allowGroup({ includeAddedBy: true, includeCreator: false }),
        ],
      )
    } else {
      showOptions(
        [translate("remove"), translate("remove_and_block_inviter"), translate("Cancel")],
        `${translate("remove")} ${groupName}?`,
        [
          () => blockGroup({ includeAddedBy: false, includeCreator: false }),
          () => blockGroup({ includeAddedBy: true, includeCreator: false }),
        ],
      )
    }
  }
}

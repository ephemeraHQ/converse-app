import { ActionSheetOptions, useActionSheet } from "@expo/react-native-action-sheet"
import { useEffect } from "react"
import { create } from "zustand"

type ActionSheetCallback = (index?: number) => void | Promise<void>

type IActionSheetState = {
  isShown: boolean
  options: ActionSheetOptions | null
  callback: ActionSheetCallback | null
  actions: {
    showActionSheet: (options: ActionSheetOptions, callback: ActionSheetCallback) => void
    hideActionSheet: () => void
  }
}

const useActionSheetStore = create<IActionSheetState>((set) => ({
  isShown: false,
  options: null,
  callback: null,

  actions: {
    showActionSheet: (options, callback) => {
      // If only one option, select it automatically
      if (options.options.length === 1) {
        callback(0)
        return
      }

      set({
        isShown: true,
        options,
        callback,
      })
    },

    hideActionSheet: () => {
      set({
        isShown: false,
        options: null,
        callback: null,
      })
    },
  },
}))

export function ActionSheet() {
  const { showActionSheetWithOptions } = useActionSheet()
  const { isShown, options, callback, actions } = useActionSheetStore()

  useEffect(() => {
    if (isShown && options && callback) {
      showActionSheetWithOptions(options, (selectedIndex?: number) => {
        actions.hideActionSheet()
        callback(selectedIndex)
      })
    }
  }, [isShown, options, callback, actions, showActionSheetWithOptions])

  return null
}

export function showActionSheet(args: {
  options: ActionSheetOptions
  callback: ActionSheetCallback
}) {
  useActionSheetStore.getState().actions.showActionSheet(args.options, args.callback)
}

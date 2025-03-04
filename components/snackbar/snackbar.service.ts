import { Haptics } from "@utils/haptics"
import { v4 as uuidv4 } from "uuid"
import { useSnackBarStore } from "@/components/snackbar/snackbar.store"
import { ISnackbar } from "@/components/snackbar/snackbar.types"

export type INewSnackbar = Partial<Exclude<ISnackbar, "key">> & {
  message: string
}

export function showSnackbar(newSnackbar: INewSnackbar) {
  Haptics.softImpactAsync()

  useSnackBarStore.setState((prev) => {
    return {
      snackbars: [
        {
          message: newSnackbar.message,
          isMultiLine: newSnackbar.isMultiLine || false,
          key: uuidv4(),
          type: newSnackbar.type ?? "info",
          actions: newSnackbar.actions ?? [],
        },
        ...prev.snackbars,
      ],
    }
  })
}

export function clearAllSnackbars() {
  useSnackBarStore.getState().clearAllSnackbars()
}

export function useSnackbars() {
  return useSnackBarStore((state) => state.snackbars)
}

export function dismissSnackbar(key: string) {
  useSnackBarStore.setState((prev) => {
    return {
      snackbars: prev.snackbars.filter((item) => item.key !== key),
    }
  })
}

export function onSnackbarsChange(callback: (snackbars: ISnackbar[]) => void) {
  return useSnackBarStore.subscribe((state) => state.snackbars, callback)
}

export function onNewSnackbar(callback: (snackbar: ISnackbar) => void) {
  return useSnackBarStore.subscribe(
    (state) => state.snackbars,
    (snackbars, previousSnackbars) => {
      const firstSnackbar = snackbars[0]
      if (firstSnackbar) {
        callback(firstSnackbar)
      }
    },
  )
}

export function getNumberOfSnackbars() {
  return useSnackBarStore.getState().snackbars.length
}

export function getSnackbarIndex(key: string) {
  return useSnackBarStore.getState().snackbars.findIndex((item) => item.key === key)
}

import React, { memo } from "react"
import { SnackbarBackdrop } from "@/components/snackbar/snackbar-backdrop/snackbar-backdrop"
import { dismissSnackbar, useSnackbars } from "@/components/snackbar/snackbar.service"
import { ISnackbar } from "@/components/snackbar/snackbar.types"
import { Snackbar } from "./snackbar"

export type InternalSnackbarContextType = {
  snackbars: ISnackbar[]
}

export const InternalSnackbarContext = React.createContext<InternalSnackbarContextType>({
  snackbars: [],
})

export const Snackbars = memo(function Snackbars() {
  const snackbars = useSnackbars()

  return (
    <>
      {snackbars.map((snackbar) => (
        <Snackbar
          key={snackbar.key}
          snackbar={snackbar}
          onDismiss={() => dismissSnackbar(snackbar.key)}
        />
      ))}
      {typeof SnackbarBackdrop !== "undefined" && <SnackbarBackdrop />}
    </>
  )
})

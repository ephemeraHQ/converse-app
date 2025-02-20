import {
  dismissSnackbar,
  useSnackbars,
} from "@/components/snackbar/snackbar.service";
import React, { memo } from "react";
import { Snackbar } from "./snackbar";
import { SnackbarBackdrop } from "@/components/snackbar/snackbar-backdrop/snackbar-backdrop";
import { ISnackbar } from "@/components/snackbar/snackbar.types";

export type InternalSnackbarContextType = {
  snackbars: ISnackbar[];
};

export const InternalSnackbarContext =
  React.createContext<InternalSnackbarContextType>({
    snackbars: [],
  });

export const Snackbars = memo(function Snackbars() {
  const snackbars = useSnackbars();

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
  );
});

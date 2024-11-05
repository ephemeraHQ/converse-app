import {
  dismissSnackbar,
  useSnackbars,
} from "@components/Snackbar/Snackbar.service";
import React, { memo } from "react";
import { Snackbar } from "./Snackbar";
import { SnackbarBackdrop } from "@components/Snackbar/SnackbarBackdrop/SnackbarBackdrop";

export type InternalSnackbarContextType = {
  snackbars: SnackbarType[];
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
      <SnackbarBackdrop />
    </>
  );
});

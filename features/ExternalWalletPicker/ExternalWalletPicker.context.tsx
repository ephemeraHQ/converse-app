import { useBottomSheetModalRef } from "@design-system/BottomSheet/BottomSheet.utils";
import { IBottomSheetModalRef } from "@design-system/BottomSheet/IBottomSheet.types";
import { UserCancelledError } from "@utils/error";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { Account, Wallet } from "thirdweb/wallets";

type IPromiseResolveType = { wallet: Wallet; account: Account };

type IExternalWalletPickerContextType = {
  bottomSheetRef: IBottomSheetModalRef;
  openAndWaitForWalletPicked: () => Promise<IPromiseResolveType>;
  close: () => void;
  onError: (error: Error) => void;
  onWalletPicked: (args: IPromiseResolveType) => void;
  handleDismiss: () => void;
};

type IExternalWalletPickerContextProps = {
  children: React.ReactNode;
};

const ExternalWalletPickerContext =
  createContext<IExternalWalletPickerContextType>(
    {} as IExternalWalletPickerContextType
  );

export const ExternalWalletPickerContextProvider = (
  props: IExternalWalletPickerContextProps
) => {
  const { children } = props;

  const bottomSheetRef = useBottomSheetModalRef();

  const promiseRef = useRef<{
    resolve: (value: IPromiseResolveType) => void;
    reject: (reason?: any) => void;
  } | null>(null);

  const openAndWaitForWalletPicked = useCallback(() => {
    bottomSheetRef.current?.present();
    return new Promise<IPromiseResolveType>((resolve, reject) => {
      promiseRef.current = { resolve, reject };
    });
  }, [bottomSheetRef]);

  const close = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef]);

  const onWalletPicked = useCallback((args: IPromiseResolveType) => {
    const { wallet, account } = args;
    if (promiseRef.current) {
      promiseRef.current.resolve({ wallet, account });
      promiseRef.current = null;
    }
  }, []);

  const onError = useCallback((error: Error) => {
    if (promiseRef.current) {
      promiseRef.current.reject(error);
      promiseRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    if (promiseRef.current) {
      // Reject the promise if the bottom sheet is dismissed without picking a wallet
      promiseRef.current.reject(
        new UserCancelledError(
          "Bottom sheet dismissed without picking a wallet"
        )
      );
      promiseRef.current = null;
    }
  }, []);

  const value = useMemo(() => {
    return {
      bottomSheetRef,
      openAndWaitForWalletPicked,
      close,
      onError,
      onWalletPicked,
      handleDismiss,
    };
  }, [
    bottomSheetRef,
    openAndWaitForWalletPicked,
    close,
    onError,
    onWalletPicked,
    handleDismiss,
  ]);

  return (
    <ExternalWalletPickerContext.Provider value={value}>
      {children}
    </ExternalWalletPickerContext.Provider>
  );
};

export function useExternalWalletPickerContext(): IExternalWalletPickerContextType {
  const context = useContext(ExternalWalletPickerContext);
  if (!context) {
    throw new Error(
      "useExternalWalletPickerContext must be used within an ExternalWalletPickerContextProvider"
    );
  }
  return context;
}

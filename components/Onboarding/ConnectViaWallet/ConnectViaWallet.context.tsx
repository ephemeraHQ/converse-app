import React, { createContext, useContext, useMemo } from "react";

export type IConnectViaWalletContextType = {
  onDoneConnecting: () => void;
  onErrorConnecting: (args: { error: Error }) => void;
};

type IConnectViaWalletContextProps = {
  children: React.ReactNode;
} & IConnectViaWalletContextType;

const ConnectViaWalletContext = createContext<IConnectViaWalletContextType>(
  {} as IConnectViaWalletContextType
);

export function ConnectViaWalletContextProvider({
  children,
  onDoneConnecting,
  onErrorConnecting,
}: IConnectViaWalletContextProps) {
  const value = useMemo(
    () => ({
      onDoneConnecting,
      onErrorConnecting,
    }),
    [onDoneConnecting, onErrorConnecting]
  );

  return (
    <ConnectViaWalletContext.Provider value={value}>
      {children}
    </ConnectViaWalletContext.Provider>
  );
}

export function useConnectViaWalletContext(): IConnectViaWalletContextType {
  return useContext(ConnectViaWalletContext);
}

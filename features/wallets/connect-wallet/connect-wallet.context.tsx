import React, { createContext, useCallback, useContext, useMemo } from "react"

type IConnectWalletContextType = {
  onSelectInfo: (args: { name: string; avatar: string | undefined }) => void
}

type IConnectWalletContextProps = {
  children: React.ReactNode
  onSelectInfo: (args: { name: string; avatar: string | undefined }) => void
}

const ConnectWalletContext = createContext<IConnectWalletContextType>(
  {} as IConnectWalletContextType,
)

export const ConnectWalletContextProvider = (props: IConnectWalletContextProps) => {
  const { children, onSelectInfo: onSelectInfoProp } = props

  const onSelectInfo = useCallback(
    (args: { name: string; avatar: string | undefined }) => {
      onSelectInfoProp(args)
    },
    [onSelectInfoProp],
  )

  const value = useMemo(() => ({ onSelectInfo }), [onSelectInfo])

  return <ConnectWalletContext.Provider value={value}>{children}</ConnectWalletContext.Provider>
}

export function useConnectWalletContext(): IConnectWalletContextType {
  return useContext(ConnectWalletContext)
}

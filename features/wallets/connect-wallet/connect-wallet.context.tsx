import React, { createContext, useCallback, useContext, useMemo } from "react"

type IConnectWalletContextType = {
  onSelectName: (name: string) => void
}

type IConnectWalletContextProps = {
  children: React.ReactNode
  onSelectName: (name: string) => void
}

const ConnectWalletContext = createContext<IConnectWalletContextType>(
  {} as IConnectWalletContextType,
)

export const ConnectWalletContextProvider = (
  props: IConnectWalletContextProps,
) => {
  const { children, onSelectName: onSelectNameProp } = props

  const onSelectName = useCallback(
    (name: string) => {
      onSelectNameProp(name)
    },
    [onSelectNameProp],
  )

  const value = useMemo(() => ({ onSelectName }), [onSelectName])

  return (
    <ConnectWalletContext.Provider value={value}>
      {children}
    </ConnectWalletContext.Provider>
  )
}

export function useConnectWalletContext(): IConnectWalletContextType {
  return useContext(ConnectWalletContext)
}

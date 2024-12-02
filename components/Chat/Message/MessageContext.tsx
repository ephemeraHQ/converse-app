import React, { createContext, useCallback, useContext, useMemo } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";

type IMessageContextType = {
  showTime: () => void;
  hideTime: () => void;
  toggleTime: () => void;
  showTimeAV: SharedValue<boolean>;
};

type IMessageContextProps = {
  children: React.ReactNode;
};

const MessageContext = createContext<IMessageContextType>(
  {} as IMessageContextType
);

export const MessageContextProvider = (props: IMessageContextProps) => {
  const { children } = props;

  const showTimeAV = useSharedValue(false);

  const showTime = useCallback(() => {
    showTimeAV.value = true;
  }, [showTimeAV]);

  const hideTime = useCallback(() => {
    showTimeAV.value = false;
  }, [showTimeAV]);

  const toggleTime = useCallback(() => {
    showTimeAV.value = !showTimeAV.value;
  }, [showTimeAV]);

  const value = useMemo(
    () => ({ showTime, hideTime, showTimeAV, toggleTime }),
    [showTime, hideTime, showTimeAV, toggleTime]
  );

  return (
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
};

export function useMessageContext(): IMessageContextType {
  return useContext(MessageContext);
}

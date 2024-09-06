import { createContext } from "react";
import type { SharedValue } from "react-native-reanimated";

import { CONTEXT_MENU_STATE } from "./contstants";
import { MenuInternalProps } from "./types";

export type InternalContextType = {
  state: SharedValue<CONTEXT_MENU_STATE>;
  theme: SharedValue<"light" | "dark">;
  menuProps: SharedValue<MenuInternalProps>;
  safeAreaInsets?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

// @ts-ignore
export const InternalContext = createContext<InternalContextType>();

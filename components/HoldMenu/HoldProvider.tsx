import { PortalProvider } from "@gorhom/portal";
import { CONTEXT_MENU_STATE } from "@utils/contextMenu/contstants";
import { InternalContext } from "@utils/contextMenu/internalContext";
import { MenuInternalProps } from "@utils/contextMenu/types";
import React, { memo, useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HoldItemBackdrop } from "./HoldItemBackdrop";
import { HoldMenu } from "./HoldMenu";
import { Action, StateProps } from "./reducer";

export interface Store {
  state: StateProps;
  dispatch?: React.Dispatch<Action>;
}

export let AnimatedIcon: any;

const ProviderComponent = ({
  children,
  onOpen,
  onClose,
}: {
  children: React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
}) => {
  const state = useSharedValue<CONTEXT_MENU_STATE>(
    CONTEXT_MENU_STATE.UNDETERMINED
  );
  const selectedTheme = useColorScheme();
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useSharedValue<"light" | "dark">(selectedTheme || "light");
  const menuProps = useSharedValue<MenuInternalProps>({
    itemHeight: 0,
    itemWidth: 0,
    itemX: 0,
    itemY: 0,
    items: [],
    anchorPosition: "top-center",
    menuHeight: 0,
    transformValue: 0,
    actionParams: {},
  });

  useEffect(() => {
    theme.value = selectedTheme || "light";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTheme]);

  useAnimatedReaction(
    () => state.value,
    (state) => {
      switch (state) {
        case CONTEXT_MENU_STATE.ACTIVE: {
          if (onOpen) runOnJS(onOpen)();
          break;
        }
        case CONTEXT_MENU_STATE.END: {
          if (onClose) runOnJS(onClose)();
          break;
        }
      }
    },
    [state]
  );

  const internalContextVariables = useMemo(
    () => ({
      state,
      theme,
      menuProps,
    }),
    [state, theme, menuProps]
  );
  console.log("here1111 state", state.value);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <InternalContext.Provider value={internalContextVariables}>
        <PortalProvider>
          {children}
          <HoldItemBackdrop />
          <HoldMenu />
        </PortalProvider>
      </InternalContext.Provider>
    </GestureHandlerRootView>
  );
};

export const HoldMenuProvider = memo(ProviderComponent);

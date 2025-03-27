import { focusManager } from "@tanstack/react-query"
import { useEffect } from "react"
import { AppState, AppStateStatus } from "react-native"
import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { logger } from "@/utils/logger"

type State = {
  currentState: AppStateStatus
  previousState: AppStateStatus | null
}

type Actions = {
  handleAppStateChange: (nextAppState: AppStateStatus) => void
}

export const useAppState = create<State & { actions: Actions }>()(
  subscribeWithSelector((set) => ({
    currentState: AppState.currentState,
    previousState: null,

    actions: {
      handleAppStateChange: (nextAppState) =>
        set((state) => {
          return {
            previousState: state.currentState,
            currentState: nextAppState,
          }
        }),
    },
  })),
)

// Just for debugging
useAppState.subscribe(
  (state) => state.currentState,
  (currentState, previousState) => {
    logger.debug("App state changed", {
      from: previousState,
      to: currentState,
    })
  },
)

// Update the new state
AppState.addEventListener("change", (nextAppState) => {
  focusManager.setFocused(nextAppState === "active")
  useAppState.getState().actions.handleAppStateChange(nextAppState)
})

type IAppStateHandlerSettings = {
  onChange?: (status: AppStateStatus) => void
  onForeground?: () => void
  onBackground?: () => void
  onInactive?: () => void
  deps?: React.DependencyList
}

export const useAppStateHandler = (settings?: IAppStateHandlerSettings) => {
  const { onChange, onForeground, onBackground, onInactive, deps = [] } = settings || {}

  useEffect(() => {
    return useAppState.subscribe(
      (state) => ({ current: state.currentState, previous: state.previousState }),
      (next, prev) => {
        if (next.current === "active" && prev?.current !== "active") {
          onForeground?.()
        } else if (prev?.current === "active" && next.current === "background") {
          onBackground?.()
        } else if (prev?.current === "active" && next.current === "inactive") {
          onInactive?.()
        }

        onChange?.(next.current)
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, onForeground, onBackground, onInactive, ...deps])
}

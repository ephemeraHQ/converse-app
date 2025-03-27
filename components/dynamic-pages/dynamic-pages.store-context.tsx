import { createContext, useContext, useEffect, useRef } from "react"
import { createStore, useStore } from "zustand"

type IPageChangeArgs = {
  pageIndex: number
  pageHeight: number
}

type IDynamicPagesStoreProps = {
  onPageChange?: (args: IPageChangeArgs) => void
}

type IDynamicPagesStoreState = IDynamicPagesStoreProps & {
  currentPageIndex: number
  pageHeights: Record<number, number>
  actions: {
    goToNextPage: () => void
    goToPreviousPage: () => void
    reset: () => void
    updatePageHeight: (args: { pageIndex: number; height: number }) => void
  }
}

type IDynamicPagesStoreProviderProps = React.PropsWithChildren<IDynamicPagesStoreProps>

type IDynamicPagesStore = ReturnType<typeof createDynamicPagesStore>

export function DynamicPagesStoreProvider({ children, ...props }: IDynamicPagesStoreProviderProps) {
  const storeRef = useRef<IDynamicPagesStore>()

  if (!storeRef.current) {
    storeRef.current = createDynamicPagesStore(props)
  }

  // Update onPageChange if it changes
  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.setState({ onPageChange: props.onPageChange })
    }
  }, [props.onPageChange])

  return (
    <DynamicPagesStoreContext.Provider value={storeRef.current}>
      {children}
    </DynamicPagesStoreContext.Provider>
  )
}

const createDynamicPagesStore = (initProps: IDynamicPagesStoreProps) => {
  const DEFAULT_PROPS: IDynamicPagesStoreProps = {
    onPageChange: undefined,
  }

  return createStore<IDynamicPagesStoreState>()((set, get) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    currentPageIndex: 0,
    pageHeights: {},
    actions: {
      goToNextPage: () => {
        set((state) => {
          const newIndex = state.currentPageIndex + 1
          const pageHeight = state.pageHeights[newIndex]

          // Call onPageChange callback if provided
          if (state.onPageChange) {
            state.onPageChange({
              pageIndex: newIndex,
              pageHeight,
            })
          }

          return {
            ...state,
            currentPageIndex: newIndex,
          }
        })
      },
      goToPreviousPage: () => {
        set((state) => {
          const newIndex = state.currentPageIndex - 1
          const pageHeight = state.pageHeights[newIndex]

          // Call onPageChange callback if provided
          if (state.onPageChange) {
            state.onPageChange({
              pageIndex: newIndex,
              pageHeight,
            })
          }

          return {
            ...state,
            currentPageIndex: newIndex,
          }
        })
      },
      reset: () => {
        set((state) => {
          // Only call onPageChange if we're not already at index 0
          if (state.onPageChange && state.currentPageIndex !== 0) {
            const pageHeight = state.pageHeights[0]

            state.onPageChange({
              pageIndex: 0,
              pageHeight,
            })
          }

          return {
            ...state,
            currentPageIndex: 0,
          }
        })
      },
      updatePageHeight: (args) => {
        const { pageIndex, height } = args

        set((state) => {
          // Only update if height actually changed
          if (state.pageHeights[pageIndex] === height) {
            return state
          }

          const newPageHeights = {
            ...state.pageHeights,
            [pageIndex]: height,
          }

          // If this is the current page, notify about the height change
          if (pageIndex === state.currentPageIndex && state.onPageChange) {
            state.onPageChange({
              pageIndex,
              pageHeight: height,
            })
          }

          return {
            ...state,
            pageHeights: newPageHeights,
          }
        })
      },
    },
  }))
}

const DynamicPagesStoreContext = createContext<IDynamicPagesStore | null>(null)

export function useDynamicPagesStoreContext<T>(selector: (state: IDynamicPagesStoreState) => T): T {
  const store = useContext(DynamicPagesStoreContext)

  if (!store) {
    throw new Error("Missing DynamicPagesStoreProvider.Provider in the tree")
  }

  return useStore(store, selector)
}

export function useDynamicPagesStore() {
  const store = useContext(DynamicPagesStoreContext)

  if (!store) {
    throw new Error("Missing DynamicPagesStoreProvider.Provider in the tree")
  }

  return store
}

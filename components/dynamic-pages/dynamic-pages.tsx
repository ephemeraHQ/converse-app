import { memo, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import { FadeIn } from "react-native-reanimated"
import { AnimatedVStack } from "@/design-system/VStack"
import {
  DynamicPagesStoreProvider,
  useDynamicPagesStore,
  useDynamicPagesStoreContext,
} from "./dynamic-pages.store-context"

export type IDynamicPagesRef = {
  nextPage: () => void
  previousPage: () => void
  reset: () => void
}

export type IDynamicPagesProps = {
  actionRef?: React.Ref<IDynamicPagesRef>
  pages: React.ReactNode[]
}

export const DynamicPages = memo(function DynamicPages(props: IDynamicPagesProps) {
  return (
    <DynamicPagesStoreProvider>
      <Main {...props} />
    </DynamicPagesStoreProvider>
  )
})

const Main = memo(function Main(props: IDynamicPagesProps) {
  const { pages, actionRef } = props

  const store = useDynamicPagesStore()

  useImperativeHandle(actionRef, () => ({
    nextPage() {
      store.getState().actions.goToNextPage()
    },
    previousPage() {
      store.getState().actions.goToPreviousPage()
    },
    reset() {
      store.getState().actions.reset()
    },
  }))

  const currentPageIndex = useDynamicPagesStoreContext((state) => state.currentPageIndex)

  const currentPage = useMemo(() => {
    return pages[currentPageIndex]
  }, [currentPageIndex, pages])

  if (!currentPage) {
    throw new Error("No page for dynamic pages component with index: " + currentPageIndex)
  }

  return <PageAnimationContainer>{currentPage}</PageAnimationContainer>
})

const PageAnimationContainer = memo(function PageAnimationContainer(props: {
  children: React.ReactNode
}) {
  const { children } = props

  const currentPageIndex = useDynamicPagesStoreContext((state) => state.currentPageIndex)

  const previousPageIndexRef = useRef<number | null>(null)

  useEffect(() => {
    if (currentPageIndex === null) {
      previousPageIndexRef.current = null
    }
    previousPageIndexRef.current = currentPageIndex
  }, [currentPageIndex])

  const direction = useMemo(() => {
    if (previousPageIndexRef.current === null) {
      return "forward"
    }
    if (currentPageIndex > previousPageIndexRef.current) {
      return "forward"
    } else {
      return "backward"
    }
  }, [currentPageIndex])

  return (
    <ChangeSectionAnimation key={currentPageIndex} direction={direction}>
      {children}
    </ChangeSectionAnimation>
  )
})

//  const HandleComponent = memo(function HandleComponent(props: {
//   currentPageIndex: number
// }) {
//   const { currentPageIndex } = props
//   return (
//     <Box>
//       <ActionsBar currentPageIndex={currentPageIndex} />
//       <BottomSheetCustomHandleBar />
//     </Box>
//   )
// })

const ChangeSectionAnimation = memo(function ChangeSectionAnimation(props: {
  direction: "backward" | "forward"
  children: React.ReactNode
}) {
  const { direction, children } = props

  return (
    <AnimatedVStack
    // entering={FadeIn}
    >
      {children}
    </AnimatedVStack>
  )
})

import { PropsWithChildren } from "react"
import { ViewStyle } from "react-native"
import { useAppTheme } from "@/theme/use-app-theme"
import { EntryOrExitLayoutType } from "@/utils/react-native-reanimated"
import { AnimatedVStack } from "./VStack"

type IStaggeredAnimationProps = PropsWithChildren<{
  index: number
  totalItems: number
  delayBetweenItems?: number
  baseDelay?: number
  isReverse?: boolean
  getEnteringAnimation?: (args: { delay: number }) => EntryOrExitLayoutType
  getExitingAnimation?: (args: { delay: number }) => EntryOrExitLayoutType
  style?: ViewStyle
}>

export function StaggeredAnimation(args: IStaggeredAnimationProps) {
  const { theme } = useAppTheme()

  const {
    children,
    index,
    totalItems,
    delayBetweenItems = 60,
    baseDelay = 100,
    style,
    isReverse = false,
  } = args

  const delay = isReverse
    ? (totalItems - index) * delayBetweenItems + baseDelay
    : index * delayBetweenItems + baseDelay

  const {
    getEnteringAnimation = (args: { delay: number }) =>
      theme.animation.reanimatedFadeInScaleIn({
        delay,
      }),
    getExitingAnimation,
  } = args

  return (
    <AnimatedVStack
      style={style}
      entering={getEnteringAnimation({ delay })}
      exiting={getExitingAnimation ? getExitingAnimation({ delay }) : undefined}
    >
      {children}
    </AnimatedVStack>
  )
}

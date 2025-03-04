import React, { memo, useEffect, useRef } from "react"
import {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { AnimatedCenter } from "@/design-system/Center"
import { AnimatableText } from "@/design-system/Text/AnimatedText"
import { ITextProps } from "@/design-system/Text/Text.props"

type IAnimatedTextCarouselProps = {
  texts: string[]
  textStyle?: ITextProps["style"]
  msDelayBetweenTextChange?: number
}

export const AnimatedTextCarousel = memo(function AnimatedTextCarousel({
  texts,
  msDelayBetweenTextChange = 2000,
  textStyle,
}: IAnimatedTextCarouselProps) {
  const indexAV = useSharedValue(1)
  const indexRef = useRef(0)

  const textAV = useDerivedValue(() => {
    return texts[Math.round(indexAV.value - 1) % texts.length]
  })

  useEffect(() => {
    let interval: NodeJS.Timeout
    cancelAnimation(indexAV)
    indexAV.value = 1

    const startInterval = () => {
      if (interval) clearInterval(interval)

      interval = setInterval(() => {
        const currentIndex = indexRef.current
        const newIndex = (currentIndex + 1) % texts.length
        indexRef.current = newIndex

        // When transitioning from last to first item, animate through an intermediate value
        // to create a smooth fade transition
        if (newIndex === 0) {
          // First animate to an intermediate value (texts.length + 0.5)
          indexAV.value = withSequence(
            withTiming(texts.length + 0.5, {
              duration: msDelayBetweenTextChange / 2,
            }),
            withTiming(0.5, { duration: 0 }),
            withTiming(1, {
              duration: msDelayBetweenTextChange / 2,
            }),
          )
        } else {
          // Normal case: animate to the next index + 1 for the fade effect
          indexAV.value = withTiming(newIndex + 1, {
            duration: msDelayBetweenTextChange,
          })
        }
      }, msDelayBetweenTextChange)
    }

    startInterval()

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [texts, msDelayBetweenTextChange, indexAV])

  const textAS = useAnimatedStyle(() => {
    const progress = indexAV.value % 1
    const opacity = interpolate(progress, [0, 0.4, 0.6, 1], [1, 0, 0, 1], "clamp")

    return {
      opacity,
    }
  })

  return (
    <AnimatedCenter>
      <AnimatableText text={textAV} style={[textStyle, textAS, { textAlign: "center" }]} />
    </AnimatedCenter>
  )
})

import { HStack } from "@design-system/HStack"
import { useMemo } from "react"
import { useAppTheme } from "@/theme/use-app-theme"
import { debugBorder } from "@/utils/debug-style"

export const BubbleContainer = ({
  children,
  fromMe,
}: {
  children: React.ReactNode
  fromMe: boolean
}) => {
  return (
    <HStack
      // {...debugBorder()}
      style={{
        ...(fromMe ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" }),
      }}
    >
      {children}
    </HStack>
  )
}

type IBubbleContentContainerProps = {
  children: React.ReactNode
  fromMe: boolean
  hasNextMessageInSeries: boolean
}

export const BubbleContentContainer = (args: IBubbleContentContainerProps) => {
  const { children, fromMe, hasNextMessageInSeries } = args
  const { theme } = useAppTheme()

  const bubbleStyle = useMemo(() => {
    const baseStyle = {
      backgroundColor: fromMe ? theme.colors.bubbles.bubble : theme.colors.bubbles.received.bubble,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xxs,
      maxWidth: theme.layout.screen.width * 0.7,
    }

    if (!hasNextMessageInSeries) {
      return {
        ...baseStyle,
        borderBottomLeftRadius: fromMe ? theme.borderRadius.sm : theme.spacing["4xs"],
        borderBottomRightRadius: fromMe ? theme.spacing["4xs"] : theme.borderRadius.sm,
      }
    }

    return baseStyle
  }, [fromMe, hasNextMessageInSeries, theme])

  return <HStack style={bubbleStyle}>{children}</HStack>
}

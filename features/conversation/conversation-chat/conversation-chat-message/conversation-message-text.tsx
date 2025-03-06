import { memo } from "react"
import { ClickableText } from "@/components/clickable-text"
import { useAppTheme } from "@/theme/use-app-theme"

type IMessageTextProps = {
  children: React.ReactNode
  inverted?: boolean
}

export const MessageText = memo(function MessageText(args: IMessageTextProps) {
  const { children, inverted } = args

  const { theme } = useAppTheme()

  return (
    <ClickableText
      style={{
        color: inverted ? theme.colors.text.inverted.primary : theme.colors.text.primary,
      }}
    >
      {children}
    </ClickableText>
  )
})

import { memo } from "react"

export const ConditionalWrapper = memo(function ConditionalWrapper(props: {
  condition: boolean
  wrapper: (children: React.ReactNode) => React.ReactNode
  children: React.ReactNode
}) {
  const { condition, wrapper, children } = props

  if (condition) {
    return wrapper(children)
  }
  return children
})

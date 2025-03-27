import { memo } from "react"
import { Center } from "@/design-system/Center"

export const ConversationListItemAvatarSkeleton = memo(
  function ConversationListItemAvatarSkeleton(props: { color: string; size: number }) {
    const { color, size } = props

    return (
      <Center
        // {...debugBorder()}
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          backgroundColor: color,
        }}
      >
        {/* Keep until we're sure of final design */}
        {/* <LinearGradient
          isAbsoluteFill
          style={{
            borderRadius: 999,
            height: size,
            width: size,
          }}
          colors={[
            hexToRGBA(theme.colors.background.surfaceless, 0),
            theme.colors.background.surface,
          ]}
        /> */}
      </Center>
    )
  },
)

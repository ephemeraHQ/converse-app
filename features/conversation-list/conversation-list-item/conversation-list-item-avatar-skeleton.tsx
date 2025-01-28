import { Center } from "@/design-system/Center";
import { LinearGradient } from "@/design-system/linear-gradient";
import { useAppTheme } from "@/theme/useAppTheme";
import { hexToRGBA } from "@/utils/colors";
import { memo } from "react";

export const ConversationListItemAvatarSkeleton = memo(
  function ConversationListItemAvatarSkeleton(props: {
    color: string;
    size: number;
  }) {
    const { color, size } = props;
    const { theme } = useAppTheme();

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
        <LinearGradient
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
        />
      </Center>
    );
  }
);

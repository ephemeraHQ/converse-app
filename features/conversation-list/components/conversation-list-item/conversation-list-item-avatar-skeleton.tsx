import { Center } from "@/design-system/Center";
import { LinearGradient } from "@/design-system/linear-gradient";
import { useAppTheme } from "@/theme/useAppTheme";
import { hexToRGBA } from "@/utils/colors";
import { memo } from "react";

export const ConversationListAvatarSkeleton = memo(
  function ConversationListAvatarSkeleton(props: {
    color: string;
    size: number;
  }) {
    const { color, size } = props;

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
          colors={[hexToRGBA("#FFFFFF", 0), "#FFFFFF"]}
        />
      </Center>
    );
  }
);

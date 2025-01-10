import { Center } from "@/design-system/Center";
import { Icon } from "@/design-system/Icon/Icon";
import { Text } from "@/design-system/Text";
import { useAppTheme } from "@/theme/useAppTheme";
import { getFirstLetterForAvatar } from "@utils/getFirstLetterForAvatar";
import { Image } from "expo-image";
import React, { memo, useCallback, useState } from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";

export type IAvatarProps = {
  uri?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  name?: string;
};

export const Avatar = memo(function Avatar({
  uri,
  size,
  style,
  name,
}: IAvatarProps) {
  const { theme } = useAppTheme();
  const avatarSize = size ?? theme.avatarSize.md;
  const firstLetter = getFirstLetterForAvatar(name ?? "");
  const [didError, setDidError] = useState(false);

  const handleImageError = useCallback(() => {
    setDidError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setDidError(false);
  }, []);

  if (uri && !didError) {
    return (
      <Center style={style}>
        <Image
          onLoad={handleImageLoad}
          onError={handleImageError}
          source={{ uri }}
          style={{
            borderRadius: 9999,
            width: avatarSize,
            height: avatarSize,
          }}
          cachePolicy="memory-disk"
          testID="avatar-image"
        />
      </Center>
    );
  }

  return (
    <Center
      style={[
        {
          borderRadius: 9999,
          width: avatarSize,
          height: avatarSize,
          backgroundColor: theme.colors.fill.tertiary,
        },
        style,
      ]}
      testID="avatar-placeholder"
    >
      {name ? (
        <Text
          weight="medium"
          color="primary"
          style={{
            color: theme.colors.global.white, // white looks better for both dark/light themes
            fontSize: avatarSize / 2.4, // 2.4 is the ratio in the Figma design
            lineHeight: avatarSize / 2.4, // 2.4 is the ratio in the Figma design
          }}
        >
          {firstLetter}
        </Text>
      ) : (
        <Icon
          picto="photo"
          size={Platform.OS === "ios" ? avatarSize / 3 : avatarSize / 2}
          color="white"
        />
      )}
    </Center>
  );
});

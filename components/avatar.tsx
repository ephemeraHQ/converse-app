import { Image } from "expo-image";
import React, { memo, useCallback, useState } from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";
import { Center } from "@/design-system/Center";
import { Icon } from "@/design-system/Icon/Icon";
import { Text } from "@/design-system/Text";
import { useAppTheme } from "@/theme/use-app-theme";
import { Nullable } from "@/types/general";
import { getCapitalizedLettersForAvatar } from "@/utils/get-capitalized-letters-for-avatar";

export type IAvatarProps = {
  uri: Nullable<string>;
  name: Nullable<string>;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export const Avatar = memo(function Avatar({
  uri,
  size,
  style,
  name,
}: IAvatarProps) {
  const { theme } = useAppTheme();
  const avatarSize = size ?? theme.avatarSize.md;
  const firstLetter = getCapitalizedLettersForAvatar(name ?? "");
  const [didError, setDidError] = useState(false);

  const handleImageError = useCallback(() => {
    setDidError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setDidError(false);
  }, []);

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
      {uri && !didError ? (
        <Image
          onLoad={handleImageLoad}
          onError={handleImageError}
          source={{ uri }}
          style={{
            position: "absolute",
            borderRadius: avatarSize / 2,
            width: avatarSize,
            height: avatarSize,
          }}
          cachePolicy="memory-disk"
          testID="avatar-image"
        />
      ) : name ? (
        <Text
          weight="medium"
          style={{
            color: theme.colors.global.white, // white looks better for both dark/light themes
            fontSize: avatarSize / 2.4, // 2.4 is the ratio in the Figma design
            lineHeight: avatarSize / 2.4, // 2.4 is the ratio in the Figma design
            paddingTop: avatarSize / 15, // 15 is totally random and padding top shouldn't be needed but otherwise the text is not centered
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

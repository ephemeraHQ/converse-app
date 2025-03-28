import { Image } from "expo-image"
import React, { memo, useCallback, useState } from "react"
import { ImageSourcePropType, Platform, StyleProp, ViewStyle } from "react-native"
import { Center } from "@/design-system/Center"
import { Icon } from "@/design-system/Icon/Icon"
import { Text } from "@/design-system/Text"
import { useAppTheme } from "@/theme/use-app-theme"
import { Nullable } from "@/types/general"
import { getCapitalizedLettersForAvatar } from "@/utils/get-capitalized-letters-for-avatar"

export type IAvatarProps = {
  name: Nullable<string>
  source?: Nullable<string | ImageSourcePropType>
  uri?: Nullable<string> // Kept for backward compatibility
  size?: "sm" | "md" | "lg" | "xl" | "xxl"
  sizeNumber?: number
  style?: StyleProp<ViewStyle>
}

export const Avatar = memo(function Avatar({
  source,
  uri,
  sizeNumber,
  size = "md",
  style,
  name,
}: IAvatarProps) {
  const { theme } = useAppTheme()
  const firstLetter = getCapitalizedLettersForAvatar(name ?? "")
  const [didError, setDidError] = useState(false)

  const avatarSize =
    sizeNumber ??
    {
      sm: theme.avatarSize.sm,
      md: theme.avatarSize.md,
      lg: theme.avatarSize.lg,
      xl: theme.avatarSize.xl,
      xxl: theme.avatarSize.xxl,
    }[size]

  // Use source if provided, otherwise fall back to uri for backward compatibility
  const imageSource = source ?? uri

  const handleImageError = useCallback(() => {
    setDidError(true)
  }, [])

  const handleImageLoad = useCallback(() => {
    setDidError(false)
  }, [])

  // Determine if we have a valid image source
  const hasImageSource = !!imageSource && !didError

  // Prepare the source object for the Image component
  const getImageSource = () => {
    if (typeof imageSource === "string") {
      return { uri: imageSource }
    }
    return imageSource
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
      {hasImageSource ? (
        <Image
          onLoad={handleImageLoad}
          onError={handleImageError}
          source={getImageSource()}
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
          icon="photo"
          size={Platform.OS === "ios" ? avatarSize / 3 : avatarSize / 2}
          color="white"
        />
      )}
    </Center>
  )
})

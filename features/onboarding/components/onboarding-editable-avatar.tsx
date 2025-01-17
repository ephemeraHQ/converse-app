import { Avatar } from "@/components/Avatar";
import { Center } from "@/design-system/Center";
import { Icon } from "@/design-system/Icon/Icon";
import { VStack } from "@/design-system/VStack";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { ViewStyle } from "react-native";

type IOnboardingEditableAvatarProps = {
  uri?: string;
  name?: string;
};

const $placeholderStyle: ThemedStyle<ViewStyle> = (theme) => ({
  borderRadius: 9999,
  width: theme.avatarSize.xxl,
  height: theme.avatarSize.xxl,
  backgroundColor: theme.colors.fill.minimal,
  borderWidth: theme.borderWidth.sm,
});

export const OnboardingEditableAvatar = ({
  uri,
  name,
}: IOnboardingEditableAvatarProps) => {
  const { theme, themed } = useAppTheme();
  if (!uri && !name) {
    return (
      <Center style={themed($placeholderStyle)}>
        <Icon
          icon="camera"
          size={theme.iconSize.md}
          color={theme.colors.text.primary}
        />
      </Center>
    );
  }

  return (
    <VStack style={{ width: theme.avatarSize.xxl }}>
      <Avatar uri={uri} name={name} size={theme.avatarSize.xxl} />
    </VStack>
  );
};

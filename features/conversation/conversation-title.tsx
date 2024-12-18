import { Pressable } from "@/design-system/Pressable";
import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { HStack } from "@design-system/HStack";
import { Text } from "react-native";

type ConversationTitleDumbProps = {
  title?: string;
  subtitle?: React.ReactNode;
  avatarComponent?: React.ReactNode;
  onLongPress?: () => void;
  onPress?: () => void;
};

export function ConversationTitle({
  avatarComponent,
  title,
  subtitle,
  onLongPress,
  onPress,
}: ConversationTitleDumbProps) {
  const { theme } = useAppTheme();

  return (
    <HStack
      style={{
        flex: 1,
      }}
    >
      <Pressable
        onLongPress={onLongPress}
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <HStack
          style={{
            paddingRight: theme.spacing.xxs,
          }}
        >
          {avatarComponent}
        </HStack>
        <VStack>
          <Text numberOfLines={1} allowFontScaling={false}>
            {title}
          </Text>
          {subtitle}
        </VStack>
      </Pressable>
    </HStack>
  );
}

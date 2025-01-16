import React, { memo } from "react";
import { View, Dimensions, Alert } from "react-native";
import { Avatar } from "@/components/Avatar";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { Button } from "@/design-system/Button/Button";
import { useAppTheme } from "@/theme/useAppTheme";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

type IContactCardProps = {
  displayName: string;
  userName?: string;
  avatarUri?: string;
  isMyProfile?: boolean;
  editMode?: boolean;
  onToggleEdit?: () => void;
};

/**
 * ContactCard Component
 *
 * A card component that displays contact information with a 3D tilt effect.
 * Includes display name, username and avatar with interactive animations
 */
export const ContactCard = memo(function ContactCard({
  displayName,
  userName,
  avatarUri,
  isMyProfile,
  editMode,
  onToggleEdit,
}: IContactCardProps) {
  const { theme } = useAppTheme();
  const { width: screenWidth } = Dimensions.get("window");

  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const shadowOffsetX = useSharedValue(0);
  const shadowOffsetY = useSharedValue(6);

  const baseStyle = {
    backgroundColor: theme.colors.fill.primary,
    borderRadius: theme.borderRadius.xs,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.fill.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
    // Maintains credit card aspect ratio
    height: (screenWidth - 2 * theme.spacing.lg) * 0.628,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
    shadowOffset: {
      width: shadowOffsetX.value,
      height: shadowOffsetY.value,
    },
    ...baseStyle,
  }));

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
      shadowOffsetX.value = withSpring(0);
      shadowOffsetY.value = withSpring(0);
    })
    .onUpdate((event) => {
      rotateX.value = event.translationY / 10;
      rotateY.value = event.translationX / 10;
      shadowOffsetX.value = -event.translationX / 20;
      shadowOffsetY.value = event.translationY / 20;
    })
    .onEnd(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
      shadowOffsetX.value = withSpring(0);
      shadowOffsetY.value = withSpring(0);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <VStack style={{ flex: 1, justifyContent: "space-between" }}>
          {/* Top row with Avatar and Edit button */}
          <VStack
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Avatar
              uri={avatarUri}
              name={displayName}
              size={theme.avatarSize.lg}
            />
            {isMyProfile && (
              <Button
                variant="link.bare"
                size="sm"
                text={editMode ? "Done" : "Edit"}
                textStyle={{ color: theme.colors.text.inverted.primary }}
                pressedTextStyle={{
                  color: theme.colors.text.inverted.secondary,
                }}
                onPress={onToggleEdit}
              />
            )}
          </VStack>

          {/* Name and Username - now positioned at bottom */}
          <VStack>
            <Text
              preset="bodyBold"
              style={{
                color: theme.colors.text.inverted.primary,
                marginBottom: theme.spacing.xxxs,
              }}
            >
              {displayName}
            </Text>
            {userName && (
              <Text
                preset="smaller"
                style={{ color: theme.colors.text.inverted.secondary }}
              >
                {userName}
              </Text>
            )}
          </VStack>
        </VStack>
      </Animated.View>
    </GestureDetector>
  );
});

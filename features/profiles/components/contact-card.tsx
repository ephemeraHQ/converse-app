import React, { memo } from "react";
import { Avatar } from "@/components/Avatar";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { Button } from "@/design-system/Button/Button";
import { useAppTheme } from "@/theme/useAppTheme";
import { AnimatedCardContainer } from "./animated-card-container";
import { TextField } from "@/design-system/TextField/TextField";
import { translate } from "@/i18n";
import { Pressable } from "@/design-system/Pressable";
import { HStack } from "@/design-system/HStack";
import { Icon } from "@/design-system/Icon/Icon";

type IContactCardProps = {
  displayName: string;
  userName?: string;
  avatarUri?: string;
  isMyProfile?: boolean;
  editMode?: boolean;
  onToggleEdit?: () => void;
  onAvatarPress?: () => void;
  onDisplayNameChange?: (text: string) => void;
  editableDisplayName?: string;
};

/**
 * ContactCard Component
 *
 * A pure UI component that displays contact information.
 * Can be used in both profile and onboarding flows.
 */
export const ContactCard = memo(function ContactCard({
  displayName,
  userName,
  avatarUri,
  isMyProfile,
  editMode,
  onToggleEdit,
  onAvatarPress,
  onDisplayNameChange,
  editableDisplayName,
}: IContactCardProps) {
  const { theme } = useAppTheme();

  return (
    <AnimatedCardContainer>
      <VStack style={{ flex: 1, justifyContent: "space-between" }}>
        {/* Top row with Avatar and Edit/Save button */}
        <HStack
          style={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          {editMode ? (
            <Pressable onPress={onAvatarPress}>
              <VStack>
                <Avatar
                  uri={avatarUri}
                  name={displayName}
                  size={theme.avatarSize.lg}
                />
                <Icon
                  icon="camera"
                  size={theme.iconSize.sm}
                  color={theme.colors.text.inverted.primary}
                  style={{ position: "absolute", bottom: 0, right: 0 }}
                />
              </VStack>
            </Pressable>
          ) : (
            <Avatar
              uri={avatarUri}
              name={displayName}
              size={theme.avatarSize.lg}
            />
          )}
          {isMyProfile && (
            <Button
              variant="link.bare"
              size="sm"
              text={
                editMode ? translate("profile.done") : translate("profile.edit")
              }
              textStyle={{ color: theme.colors.text.inverted.primary }}
              pressedTextStyle={{
                color: theme.colors.text.inverted.secondary,
              }}
              onPress={onToggleEdit}
            />
          )}
        </HStack>

        {/* Name and Username */}
        <VStack>
          {editMode ? (
            <TextField
              value={editableDisplayName}
              onChangeText={onDisplayNameChange}
              placeholder={translate(
                "userProfile.inputs.displayName.placeholder"
              )}
              containerStyle={{ backgroundColor: "transparent" }}
              inputWrapperStyle={{
                backgroundColor: "transparent",
                borderWidth: 0,
                paddingHorizontal: 0,
              }}
              style={{
                color: theme.colors.text.inverted.primary,
                fontWeight: "bold",
              }}
              maxLength={32}
            />
          ) : (
            <Text
              preset="bodyBold"
              style={{
                color: theme.colors.text.inverted.primary,
                marginBottom: theme.spacing.xxxs,
              }}
            >
              {displayName}
            </Text>
          )}
          {userName && (
            <Text inverted color="secondary" preset="smaller">
              {userName}
            </Text>
          )}
        </VStack>
      </VStack>
    </AnimatedCardContainer>
  );
});

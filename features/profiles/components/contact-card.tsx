import React, { memo } from "react";
import { Avatar } from "@/components/Avatar";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { AnimatedCardContainer } from "./animated-card-container";
import { TextField } from "@/design-system/TextField/TextField";
import { translate } from "@/i18n";
import { Pressable } from "@/design-system/Pressable";
import { HStack } from "@/design-system/HStack";
import { Icon } from "@/design-system/Icon/Icon";
import { Center } from "@/design-system/Center";
import {
  ICardLayoutProps,
  IEditableContactCardProps,
  IReadOnlyContactCardProps,
  IContactCardProps,
} from "../profile-types";

/**
 * CardLayout Component
 *
 * A pure layout component that handles the structure of the card.
 * Separates layout concerns from the main ContactCard component.
 */
const CardLayout = memo(function CardLayout({
  avatar,
  content,
}: ICardLayoutProps) {
  return (
    <AnimatedCardContainer>
      <VStack style={{ flex: 1, justifyContent: "space-between" }}>
        <HStack
          style={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          {avatar}
        </HStack>
        {content}
      </VStack>
    </AnimatedCardContainer>
  );
});

/**
 * EditableContactCard Component
 *
 * Handles the editable state of the contact card.
 * Contains the avatar with camera button and editable display name field.
 */
const EditableContactCard = memo(function EditableContactCard({
  displayName,
  userName,
  avatarUri,
  onAvatarPress,
  onDisplayNameChange,
  editableDisplayName,
  isLoading,
  error,
  status,
}: IEditableContactCardProps) {
  const { theme } = useAppTheme();

  const avatar = (
    <Pressable onPress={onAvatarPress} disabled={isLoading}>
      <VStack>
        <Avatar
          uri={avatarUri}
          name={displayName}
          size={theme.avatarSize.xxl}
        />
        <Center
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: theme.avatarSize.md,
            height: theme.avatarSize.md,
            borderRadius: theme.borderRadius.md,
            borderWidth: theme.borderWidth.sm,
            borderColor: theme.colors.border.inverted.subtle,
            backgroundColor: theme.colors.fill.primary,
          }}
        >
          <Icon
            icon="camera"
            size={theme.iconSize.sm}
            color={theme.colors.fill.inverted.primary}
          />
        </Center>
      </VStack>
    </Pressable>
  );

  const content = (
    <VStack style={{ marginTop: theme.spacing.md }}>
      <TextField
        label={translate("contactCard.name")}
        value={editableDisplayName}
        onChangeText={onDisplayNameChange}
        placeholder={translate("userProfile.inputs.displayName.placeholder")}
        containerStyle={{ backgroundColor: "transparent" }}
        inputWrapperStyle={{
          borderWidth: 1,
          borderColor:
            status === "error"
              ? theme.colors.global.caution
              : theme.colors.border.inverted.subtle,
          borderRadius: theme.borderRadius.xs,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        }}
        maxLength={32}
        editable={!isLoading}
        status={status}
      />
    </VStack>
  );

  return <CardLayout avatar={avatar} content={content} />;
});

/**
 * ReadOnlyContactCard Component
 *
 * Handles the read-only state of the contact card.
 * Displays the avatar and user information without edit functionality.
 */
const ReadOnlyContactCard = memo(function ReadOnlyContactCard({
  displayName,
  userName,
  avatarUri,
}: IReadOnlyContactCardProps) {
  const { theme } = useAppTheme();

  const avatar = (
    <Avatar uri={avatarUri} name={displayName} size={theme.avatarSize.lg} />
  );

  const content = (
    <VStack style={{ marginTop: theme.spacing.md }}>
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
        <Text inverted color="secondary" preset="smaller">
          {userName}
        </Text>
      )}
    </VStack>
  );

  return <CardLayout avatar={avatar} content={content} />;
});

/**
 * ContactCard Component
 *
 * A pure UI component that displays contact information.
 * Can be used in both profile and onboarding flows.
 * Switches between editable and read-only modes based on props.
 */
export const ContactCard = memo(function ContactCard({
  displayName,
  userName,
  avatarUri,
  isMyProfile,
  editMode,
  onAvatarPress,
  onDisplayNameChange,
  editableDisplayName,
  isLoading,
  error,
  status,
}: IContactCardProps) {
  if (editMode) {
    return (
      <EditableContactCard
        displayName={displayName}
        userName={userName}
        avatarUri={avatarUri}
        onAvatarPress={onAvatarPress}
        onDisplayNameChange={onDisplayNameChange}
        editableDisplayName={editableDisplayName}
        isLoading={isLoading}
        error={error}
        status={status}
      />
    );
  }

  return (
    <ReadOnlyContactCard
      displayName={displayName}
      userName={userName}
      avatarUri={avatarUri}
    />
  );
});

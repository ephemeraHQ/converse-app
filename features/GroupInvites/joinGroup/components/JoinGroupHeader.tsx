import Avatar from "@components/Avatar";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";

/**
 * Renders the header for joining a group.
 *
 * This component displays the group's name, avatar (if available),
 * and description (if available).
 *
 * @param {Object} props - The component props
 * @param {string} props.groupName - The name of the group
 * @param {string} props.imageUrl - The URL of the group's avatar
 * @param {string} [props.description] - The group's description
 *
 * @example
 * // Input:
 * <JoinGroupHeader
 *   groupName="Awesome Group"
 *   imageUrl="https://example.com/avatar.jpg"
 *   description="A group for awesome people"
 * />
 * // Output: Renders header with group info
 *
 * @example
 * // Input:
 * <JoinGroupHeader
 *   groupName="Another Group"
 * />
 * // Output: Renders header with group name only
 *
 * @example
 * // Input:
 * <JoinGroupHeader
 *   groupName="Another Group"
 *   imageUrl="https://example.com/another-avatar.jpg"
 * />
 * // Output: Renders header without description
 */
export const JoinGroupHeader: React.FC<{
  groupName: string;
  imageUrl?: string;
  description?: string;
}> = ({ groupName, imageUrl, description }) => {
  const styles = useStyles();

  return (
    <View style={styles.groupInfo}>
      {imageUrl && (
        <Avatar
          size={AvatarSizes.default}
          uri={imageUrl}
          name={groupName}
          style={styles.avatar}
        />
      )}
      <Text style={styles.title}>{groupName}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    groupInfo: {
      flex: 1,
    },
    avatar: {
      alignSelf: "center",
      marginTop: 11,
    },
    title: {
      color: textPrimaryColor(colorScheme),
      fontSize: 25,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 16,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: textSecondaryColor(colorScheme),
      marginVertical: 12,
      marginHorizontal: 20,
      textAlign: "center",
    },
  });
};

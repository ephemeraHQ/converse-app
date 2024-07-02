import {
  actionSecondaryColor,
  inversePrimaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { Image } from "expo-image";
import React, { useMemo, useState, useCallback } from "react";
import {
  useColorScheme,
  StyleProp,
  StyleSheet,
  ViewStyle,
  Text,
  View,
  ColorSchemeName,
} from "react-native";

const MAIN_CIRCLE_RADIUS = 50;
const MAX_VISIBLE_MEMBERS = 4;

type Member = { uri?: string; name?: string };
type Position = { x: number; y: number; size: number };
type ColorSchemeType = "light" | "dark" | null | undefined;

type GroupAvatarProps = {
  members: Member[];
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const getFirstLetter = (name?: string) =>
  name ? name.charAt(0).toUpperCase() : "";

const calculatePositions = (
  memberCount: number,
  mainCircleRadius: number
): Position[] => {
  const positionMaps: { [key: number]: Position[] } = {
    0: [],
    1: [{ x: mainCircleRadius - 50, y: mainCircleRadius - 50, size: 100 }],
    2: [
      { x: mainCircleRadius * 0.25, y: mainCircleRadius * 0.25, size: 47 },
      { x: mainCircleRadius, y: mainCircleRadius, size: 35 },
    ],
    3: [
      { x: mainCircleRadius * 0.27, y: mainCircleRadius * 0.27, size: 45 },
      { x: mainCircleRadius * 1.15, y: mainCircleRadius * 0.75, size: 35 },
      { x: mainCircleRadius * 0.6, y: mainCircleRadius * 1.2, size: 30 },
    ],
    4: [
      { x: mainCircleRadius * 0.25, y: mainCircleRadius * 0.25, size: 45 },
      { x: mainCircleRadius * 1.2, y: mainCircleRadius * 0.35, size: 25 },
      { x: mainCircleRadius * 1.1, y: mainCircleRadius * 0.9, size: 35 },
      { x: mainCircleRadius * 0.5, y: mainCircleRadius * 1.2, size: 30 },
    ],
  };

  return (
    positionMaps[memberCount] || [
      { x: mainCircleRadius * 0.25, y: mainCircleRadius * 0.25, size: 45 },
      { x: mainCircleRadius * 1.2, y: mainCircleRadius * 0.35, size: 25 },
      { x: mainCircleRadius * 0.2, y: mainCircleRadius * 1.1, size: 15 },
      { x: mainCircleRadius * 0.5, y: mainCircleRadius * 1.2, size: 30 },
      { x: mainCircleRadius * 1.1, y: mainCircleRadius * 0.9, size: 35 },
    ]
  );
};

const PlaceholderAvatar: React.FC<{
  pos: Position;
  firstLetter: string;
  colorScheme: ColorSchemeType;
  size: number;
}> = ({ pos, firstLetter, colorScheme, size }) => {
  const styles = getStyles(colorScheme);
  return (
    <View
      style={[
        styles.placeholderAvatar,
        {
          left: (pos.x / 100) * size,
          top: (pos.y / 100) * size,
          width: (pos.size / 100) * size,
          height: (pos.size / 100) * size,
          borderRadius: ((pos.size / 100) * size) / 2,
          backgroundColor:
            colorScheme === "dark"
              ? textSecondaryColor(colorScheme)
              : actionSecondaryColor(colorScheme),
        },
      ]}
    >
      <Text
        style={[
          styles.placeholderText,
          {
            color:
              colorScheme === "dark"
                ? textPrimaryColor(colorScheme)
                : inversePrimaryColor(colorScheme),
            fontSize: ((pos.size / 100) * size) / 2,
          },
        ]}
      >
        {firstLetter}
      </Text>
    </View>
  );
};

const ExtraMembersIndicator: React.FC<{
  pos: Position;
  extraMembersCount: number;
  colorScheme: ColorSchemeType;
  size: number;
}> = ({ pos, extraMembersCount, colorScheme, size }) => {
  const styles = getStyles(colorScheme);
  return (
    <View
      style={[
        styles.extraMembersIndicator,
        {
          left: (pos.x / 100) * size,
          top: (pos.y / 100) * size,
          width: (pos.size / 100) * size,
          height: (pos.size / 100) * size,
          borderRadius: ((pos.size / 100) * size) / 2,
          backgroundColor:
            colorScheme === "dark"
              ? textSecondaryColor(colorScheme)
              : actionSecondaryColor(colorScheme),
        },
      ]}
    >
      <Text
        style={[
          styles.extraMembersText,
          {
            color:
              colorScheme === "dark"
                ? textPrimaryColor(colorScheme)
                : inversePrimaryColor(colorScheme),
            fontSize: ((pos.size / 100) * size) / 2,
          },
        ]}
      >
        +{extraMembersCount}
      </Text>
    </View>
  );
};

const GroupAvatar: React.FC<GroupAvatarProps> = ({
  members,
  size = AvatarSizes.default,
  style,
}) => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  // Sort the members so that members with avatars are positioned first
  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => (a.uri ? -1 : 1)),
    [members]
  );
  const memberCount = sortedMembers.length;
  const [loadedImages, setLoadedImages] = useState<{ [key: number]: boolean }>(
    {}
  );

  const positions = useMemo(
    () => calculatePositions(memberCount, MAIN_CIRCLE_RADIUS),
    [memberCount]
  );

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages((prev) => ({ ...prev, [index]: true }));
  }, []);

  const renderMemberAvatar = useCallback(
    (member: Member, pos: Position, index: number) => {
      const firstLetter = getFirstLetter(member.name);

      const placeholderAvatar = (
        <PlaceholderAvatar
          key={`placeholder-${index}`}
          pos={pos}
          firstLetter={firstLetter}
          colorScheme={colorScheme}
          size={size}
        />
      );

      if (member.uri) {
        return (
          <View key={`avatar-${index}`} style={styles.avatarContainer}>
            <Image
              source={{ uri: member.uri }}
              style={[
                styles.memberImage,
                {
                  left: (pos.x / 100) * size,
                  top: (pos.y / 100) * size,
                  width: (pos.size / 100) * size,
                  height: (pos.size / 100) * size,
                  borderRadius: ((pos.size / 100) * size) / 2,
                },
              ]}
              onLoad={() => handleImageLoad(index)}
            />
            {!loadedImages[index] && placeholderAvatar}
          </View>
        );
      }

      return placeholderAvatar;
    },
    [colorScheme, styles, size, loadedImages, handleImageLoad]
  );

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        {positions.map((pos, index) => {
          if (index < MAX_VISIBLE_MEMBERS && index < memberCount) {
            return renderMemberAvatar(sortedMembers[index], pos, index);
          } else if (
            index === MAX_VISIBLE_MEMBERS &&
            memberCount > MAX_VISIBLE_MEMBERS
          ) {
            return (
              <ExtraMembersIndicator
                key={`extra-${index}`}
                pos={pos}
                extraMembersCount={memberCount - MAX_VISIBLE_MEMBERS}
                colorScheme={colorScheme}
                size={size}
              />
            );
          }
          return null;
        })}
      </View>
    </View>
  );
};

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    container: {
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 100,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        colorScheme === "dark"
          ? textSecondaryColor(colorScheme)
          : actionSecondaryColor(colorScheme),
      borderRadius: 100,
      opacity: 0.4,
    },
    content: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarContainer: {
      position: "absolute",
      width: "100%",
      height: "100%",
    },
    memberImage: {
      position: "absolute",
    },
    placeholderAvatar: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      color: textPrimaryColor(colorScheme),
      fontWeight: "bold",
    },
    extraMembersIndicator: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
    },
    extraMembersText: {
      color: textSecondaryColor(colorScheme),
      fontWeight: "bold",
    },
  });

export default GroupAvatar;

import { actionSecondaryColor, textSecondaryColor } from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { Image } from "expo-image";
import React, { useCallback, useState, useMemo } from "react";
import {
  ColorSchemeName,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { useProfilesStore } from "../data/store/accountsStore";
import { useGroupMembers } from "../hooks/useGroupMembers";
import { getPreferredAvatar, getPreferredName } from "../utils/profile";
import GroupAvatarSvg from "./GroupAvatarSvg";

type Props = {
  uri?: string | undefined;
  size?: number | undefined;
  style?: StyleProp<ImageStyle>;
  color?: boolean;
  name?: string | undefined;
  topic?: string | undefined;
  placeholderGroupMembers?: { address: string; uri?: string; name?: string }[];
};

function Avatar({
  uri,
  size = AvatarSizes.default,
  style,
  color,
  name,
  topic,
  placeholderGroupMembers,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme, size);
  const firstLetter = name
    ? name.startsWith("0x")
      ? name.slice(0, 2)
      : name.charAt(0).toUpperCase()
    : "";
  const [didError, setDidError] = useState(false);
  const { members } = useGroupMembers(topic || "");
  const profiles = useProfilesStore((s) => s.profiles);

  const memoizedGroupMembers = useMemo(() => {
    if (!members) return [];
    return members.ids.map((id) => {
      const member = members.byId[id];
      const address = member.addresses[0];
      const senderSocials = profiles[address]?.socials;
      return {
        address,
        uri: getPreferredAvatar(senderSocials),
        name: getPreferredName(senderSocials, address),
      };
    });
  }, [members, profiles]);

  const avatarGroupMembers = placeholderGroupMembers || memoizedGroupMembers;

  const handleImageError = useCallback(() => {
    setDidError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setDidError(false);
  }, []);

  if (avatarGroupMembers && avatarGroupMembers.length > 1) {
    return (
      <View style={[styles.image, style]}>
        <GroupAvatarSvg members={avatarGroupMembers} size={size} />
      </View>
    );
  }
  return uri && !didError ? (
    <Image
      onLoad={handleImageLoad}
      onError={handleImageError}
      key={`${uri}-${color}-${colorScheme}`}
      source={{ uri }}
      style={[styles.image, style]}
    />
  ) : (
    <View
      style={StyleSheet.flatten([
        styles.placeholder,
        style,
        { width: size, height: size, borderRadius: size / 2 },
      ])}
    >
      <Text style={styles.text}>{firstLetter}</Text>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName, size: number) =>
  StyleSheet.create({
    image: {
      width: size,
      height: size,
      borderRadius: size,
    },
    placeholder: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor:
        colorScheme === "dark"
          ? textSecondaryColor(colorScheme)
          : actionSecondaryColor(colorScheme),
      justifyContent: "center",
      alignItems: "center",
    },
    text: {
      fontSize: size / 2,
      fontWeight: "500",
      color: "white",
      textAlign: "center",
    },
  });

export default React.memo(Avatar);

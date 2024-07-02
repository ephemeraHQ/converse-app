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

import {
  useProfilesStore,
  useCurrentAccount,
} from "../data/store/accountsStore";
import { useGroupMembers } from "../hooks/useGroupMembers";
import { getPreferredAvatar, getPreferredName } from "../utils/profile";
import GroupAvatar from "./GroupAvatar";

type Props = {
  uri?: string | undefined;
  size?: number | undefined;
  style?: StyleProp<ImageStyle>;
  color?: boolean;
  name?: string | undefined;
  topic?: string | undefined;
  pendingGroupMembers?: { address: string; uri?: string; name?: string }[];
  excludeSelf?: boolean;
};

export const getFirstLetter = (name: string) => {
  return name.startsWith("0x")
    ? name.slice(0, 2)
    : name.charAt(0).toUpperCase();
};

function Avatar({
  uri,
  size = AvatarSizes.default,
  style,
  color,
  name,
  topic,
  pendingGroupMembers,
  excludeSelf = true,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme, size);
  const firstLetter = getFirstLetter(name || "");
  const [didError, setDidError] = useState(false);
  const { members } = useGroupMembers(topic || "");
  const profiles = useProfilesStore((s) => s.profiles);
  const account = useCurrentAccount();

  const memoizedGroupMembers = useMemo(() => {
    if (!members) return [];
    return members.ids.reduce(
      (acc: { address: string; uri?: string; name?: string }[], id) => {
        const member = members.byId[id];
        const address = member.addresses[0].toLowerCase();
        const senderSocials = profiles[address]?.socials;
        const shouldExclude =
          excludeSelf && account && address === account.toLowerCase();
        if (shouldExclude) return acc;
        const newMember = {
          address,
          uri: getPreferredAvatar(senderSocials),
          name: getPreferredName(senderSocials, address),
        };
        acc.push(newMember);
        return acc;
      },
      []
    );
  }, [members, profiles, account, excludeSelf]);

  const avatarGroupMembers = pendingGroupMembers || memoizedGroupMembers;

  const handleImageError = useCallback(() => {
    setDidError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setDidError(false);
  }, []);

  if (!uri && avatarGroupMembers && avatarGroupMembers.length > 1) {
    return (
      <View style={[styles.image, style]}>
        <GroupAvatar members={avatarGroupMembers} size={size} />
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

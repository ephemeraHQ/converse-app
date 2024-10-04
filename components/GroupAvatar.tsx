import {
  actionSecondaryColor,
  inversePrimaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import React, { useMemo } from "react";
import {
  useColorScheme,
  ColorSchemeName,
  StyleProp,
  StyleSheet,
  ViewStyle,
  Text,
  View,
} from "react-native";

import Avatar from "./Avatar";
import {
  useProfilesStore,
  useCurrentAccount,
} from "../data/store/accountsStore";
import { useGroupMembers } from "../hooks/useGroupMembers";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "../utils/profile";

const MAIN_CIRCLE_RADIUS = 50;
const MAX_VISIBLE_MEMBERS = 4;

type Member = { uri?: string; name?: string };
type Position = { x: number; y: number; size: number };
type ColorSchemeType = "light" | "dark" | null | undefined;

type GroupAvatarProps = {
  members?: Member[];
  size?: number;
  style?: StyleProp<ViewStyle>;
  uri?: string | undefined;
  topic?: string | undefined;
  pendingGroupMembers?: { address: string; uri?: string; name?: string }[];
  excludeSelf?: boolean;
  // Converstion List should not make requests across the bridge
  // Use data from the initial sync, and as the query gets updated
  onConversationListScreen?: boolean;
  showIndicator?: boolean;
};

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
  size = AvatarSizes.default,
  style,
  uri,
  topic,
  pendingGroupMembers,
  excludeSelf = true,
  onConversationListScreen = false,
}) => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { members: groupMembers } = useGroupMembers(
    topic || "",
    onConversationListScreen
      ? {
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: false,
          refetchInterval: false,
          staleTime: Infinity,
        }
      : undefined
  );
  const profiles = useProfilesStore((s) => s.profiles);
  const account = useCurrentAccount();

  const memoizedAndSortedGroupMembers = useMemo(() => {
    if (!groupMembers) return [];
    const members = groupMembers.ids.reduce(
      (acc: { address: string; uri?: string; name?: string }[], id) => {
        const member = groupMembers.byId[id];
        const address = member.addresses[0].toLowerCase();
        const senderSocials = getProfile(address, profiles)?.socials;
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
    // Sort the members so that members with avatars are positioned first
    return members.sort((a, b) => (a.uri ? -1 : 1));
  }, [groupMembers, profiles, account, excludeSelf]);

  const membersToDisplay = pendingGroupMembers || memoizedAndSortedGroupMembers;
  const memberCount = membersToDisplay.length;

  const positions = useMemo(
    () => calculatePositions(memberCount, MAIN_CIRCLE_RADIUS),
    [memberCount]
  );

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {uri ? (
        <Avatar size={size} uri={uri} />
      ) : (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={styles.overlay} />
          <View style={styles.content}>
            {positions.map((pos, index) => {
              if (index < MAX_VISIBLE_MEMBERS && index < memberCount) {
                return (
                  <Avatar
                    key={`avatar-${index}`}
                    uri={membersToDisplay[index].uri}
                    name={membersToDisplay[index].name}
                    size={(pos.size / 100) * size}
                    style={{
                      left: (pos.x / 100) * size,
                      top: (pos.y / 100) * size,
                      position: "absolute",
                    }}
                  />
                );
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
      )}
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

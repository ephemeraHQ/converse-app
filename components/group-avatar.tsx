import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { Center } from "@/design-system/Center";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { useGroupQuery } from "@/queries/useGroupQuery";
import { getInboxProfileSocialsQueryConfig } from "@/queries/useInboxProfileSocialsQuery";
import { $globalStyles } from "@/theme/styles";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import {
  getPreferredInboxAvatar,
  getPreferredInboxName,
} from "@/utils/profile";
import { useQueries } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useMemo } from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Avatar } from "./Avatar";

const MAIN_CIRCLE_RADIUS = 50;
const MAX_VISIBLE_MEMBERS = 4;

type Position = { x: number; y: number; size: number };

type IGroupAvatarMember = {
  address: string;
  uri?: string;
  name?: string;
};

type IGroupAvatarDumbProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  members?: IGroupAvatarMember[];
};

export const GroupAvatarMembers = memo(function GroupAvatarDumb(
  props: IGroupAvatarDumbProps
) {
  const { themed, theme } = useAppTheme();

  const { size = theme.avatarSize.md, style, members = [] } = props;

  const memberCount = members?.length || 0;

  const positions = useMemo(
    () => calculatePositions(memberCount, MAIN_CIRCLE_RADIUS),
    [memberCount]
  );

  return (
    <Center style={[{ width: size, height: size }, $container, style]}>
      <Center style={[{ width: size, height: size }, $container]}>
        <VStack style={themed($background)} />
        <Center style={$content}>
          {positions.map((pos, index) => {
            if (index < MAX_VISIBLE_MEMBERS && index < memberCount) {
              return (
                <Avatar
                  key={`avatar-${index}`}
                  uri={members[index].uri}
                  name={members[index].name}
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
                  size={size}
                />
              );
            }
            return null;
          })}
        </Center>
      </Center>
    </Center>
  );
});

export const GroupAvatar = memo(function GroupAvatar(props: {
  groupTopic: ConversationTopic;
  size?: "sm" | "md" | "lg";
}) {
  const { groupTopic, size = "md" } = props;

  const { theme } = useAppTheme();

  const currentAccount = useCurrentAccount()!;

  const { data: group } = useGroupQuery({
    account: currentAccount,
    topic: groupTopic,
  });

  const { data: members } = useGroupMembersQuery({
    account: currentAccount,
    topic: groupTopic,
  });

  const memberAddresses = useMemo(() => {
    if (!members?.ids) {
      return [];
    }

    return members.ids.reduce<string[]>((addresses, memberId) => {
      const memberAddress = members.byId[memberId]?.addresses[0];
      if (
        memberAddress &&
        memberAddress.toLowerCase() !== currentAccount?.toLowerCase()
      ) {
        addresses.push(memberAddress);
      }
      return addresses;
    }, []);
  }, [members, currentAccount]);

  const membersSocials = useQueries({
    queries:
      members?.ids.map((inboxId) =>
        getInboxProfileSocialsQueryConfig({ inboxId, caller: "group-avatar" })
      ) ?? [],
  });

  const memberData = useMemo<IGroupAvatarMember[]>(() => {
    return membersSocials.map(({ data: socials }, index) => {
      const address = memberAddresses[index];
      if (!socials) {
        return {
          address,
          name: address,
        };
      }

      return {
        address,
        uri: getPreferredInboxAvatar(socials),
        name: getPreferredInboxName(socials),
      };
    });
  }, [membersSocials, memberAddresses]);

  const sizeNumber = useMemo(() => {
    if (size === "sm") {
      return theme.avatarSize.sm;
    } else if (size === "md") {
      return theme.avatarSize.md;
    } else if (size === "lg") {
      return theme.avatarSize.lg;
    }
  }, [size, theme]);

  if (group?.imageUrlSquare) {
    return <Avatar uri={group.imageUrlSquare} size={sizeNumber} />;
  }

  return <GroupAvatarMembers members={memberData} size={sizeNumber} />;
});

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
  size: number;
}> = ({ pos, extraMembersCount, size }) => {
  const { theme, themed } = useAppTheme();

  return (
    <Center
      style={[
        themed($extraMembersContainer),
        {
          left: (pos.x / 100) * size,
          top: (pos.y / 100) * size,
          width: (pos.size / 100) * size,
          height: (pos.size / 100) * size,
          borderRadius: ((pos.size / 100) * size) / 2,
        },
      ]}
    >
      <Text
        style={[
          themed($extraMembersText),
          {
            color: theme.colors.global.white,
            fontSize: ((pos.size / 100) * size) / 2,
          },
        ]}
      >
        +{extraMembersCount}
      </Text>
    </Center>
  );
};

const $container: ViewStyle = {
  position: "relative",
  borderRadius: 999,
};

const $content: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const $background: ThemedStyle<ViewStyle> = ({ colors }) => ({
  ...$globalStyles.absoluteFill,
  backgroundColor: colors.fill.minimal,
  borderRadius: 999,
  opacity: 0.4,
});

const $extraMembersContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  backgroundColor: colors.fill.tertiary,
});

const $extraMembersText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: "bold",
  color: colors.text.primary,
});

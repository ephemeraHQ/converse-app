import {
  actionSecondaryColor,
  inversePrimaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import React, { useMemo, useState } from "react";
import { useColorScheme, StyleProp, ViewStyle, Image } from "react-native";
import Svg, {
  Circle,
  Defs,
  ClipPath,
  G,
  Image as SvgImage,
  Text,
} from "react-native-svg";

const MAIN_CIRCLE_RADIUS = 50;
const MAX_VISIBLE_MEMBERS = 4;

type Member = { uri?: string; name?: string };
type Position = { x: number; y: number; size: number };
type ColorSchemeType = "light" | "dark" | null | undefined;

type GroupAvatarSvgProps = {
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

// Components
const SafeSvgImage: React.FC<{
  uri: string;
  x: number;
  y: number;
  size: number;
  clipPath: string;
}> = ({ uri, x, y, size, clipPath }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      <Image
        source={{ uri }}
        style={{ width: 0, height: 0 }}
        onLoad={() => setIsLoaded(true)}
      />
      {isLoaded && (
        <SvgImage
          x={x}
          y={y}
          width={size}
          height={size}
          href={{ uri }}
          preserveAspectRatio="xMidYMid slice"
          clipPath={clipPath}
        />
      )}
    </>
  );
};

const PlaceholderAvatar: React.FC<{
  pos: Position;
  index: number;
  firstLetter: string;
  colorScheme: ColorSchemeType;
}> = ({ pos, index, firstLetter, colorScheme }) => (
  <G key={`placeholder-${index}`} x={pos.x} y={pos.y}>
    <Circle
      cx={pos.size / 2}
      cy={pos.size / 2}
      r={pos.size / 2}
      fill={
        colorScheme === "dark"
          ? textSecondaryColor(colorScheme)
          : actionSecondaryColor(colorScheme)
      }
    />
    <Text
      x={pos.size / 2}
      y={pos.size / 1.9}
      textAnchor="middle"
      alignmentBaseline="middle"
      fontSize={pos.size / 2}
      fontWeight="500"
      fill={
        colorScheme === "dark"
          ? textPrimaryColor(colorScheme)
          : inversePrimaryColor(colorScheme)
      }
    >
      {firstLetter}
    </Text>
  </G>
);

const ExtraMembersIndicator: React.FC<{
  pos: Position;
  extraMembersCount: number;
  colorScheme: ColorSchemeType;
}> = ({ pos, extraMembersCount, colorScheme }) => (
  <G x={pos.x} y={pos.y}>
    <Circle
      cx={pos.size / 2}
      cy={pos.size / 2}
      r={pos.size / 2}
      fill={
        colorScheme === "dark"
          ? textSecondaryColor(colorScheme)
          : actionSecondaryColor(colorScheme)
      }
    />
    <Text
      x={pos.size / 3}
      y={pos.size / 1.9}
      textAnchor="middle"
      alignmentBaseline="middle"
      fontSize={pos.size / 2}
      fontWeight="500"
      fill={
        colorScheme === "dark"
          ? textPrimaryColor(colorScheme)
          : inversePrimaryColor(colorScheme)
      }
    >
      +{extraMembersCount}
    </Text>
  </G>
);

const GroupAvatarSvg: React.FC<GroupAvatarSvgProps> = ({
  members,
  size = AvatarSizes.default,
  style,
}) => {
  const colorScheme = useColorScheme();
  const memberCount = members.length;

  const positions = useMemo(
    () => calculatePositions(memberCount, MAIN_CIRCLE_RADIUS),
    [memberCount]
  );

  const renderMemberAvatar = (member: Member, pos: Position, index: number) => {
    const firstLetter = getFirstLetter(member.name);

    const placeholderAvatar = (
      <PlaceholderAvatar
        pos={pos}
        index={index}
        firstLetter={firstLetter}
        colorScheme={colorScheme}
      />
    );

    if (member.uri) {
      return (
        <React.Fragment key={index}>
          <SafeSvgImage
            uri={member.uri}
            x={pos.x}
            y={pos.y}
            size={pos.size}
            clipPath={`url(#avatarClip${index})`}
          />
          {placeholderAvatar}
        </React.Fragment>
      );
    }

    return placeholderAvatar;
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="groupAvatarClip">
          <Circle
            cx={MAIN_CIRCLE_RADIUS}
            cy={MAIN_CIRCLE_RADIUS}
            r={MAIN_CIRCLE_RADIUS}
          />
        </ClipPath>
        {positions.map((pos, index) => (
          <ClipPath id={`avatarClip${index}`} key={`clip${index}`}>
            <Circle
              cx={pos.x + pos.size / 2}
              cy={pos.y + pos.size / 2}
              r={pos.size / 2}
            />
          </ClipPath>
        ))}
      </Defs>
      <Circle
        cx={MAIN_CIRCLE_RADIUS}
        cy={MAIN_CIRCLE_RADIUS}
        r={MAIN_CIRCLE_RADIUS - 1}
        fill={
          colorScheme === "dark"
            ? textSecondaryColor(colorScheme)
            : actionSecondaryColor(colorScheme)
        }
        opacity={0.4}
      />
      <G clipPath="url(#groupAvatarClip)">
        {positions.map((pos, index) => {
          if (index < MAX_VISIBLE_MEMBERS && index < memberCount) {
            return renderMemberAvatar(members[index], pos, index);
          } else if (
            index === MAX_VISIBLE_MEMBERS &&
            memberCount > MAX_VISIBLE_MEMBERS
          ) {
            return (
              <ExtraMembersIndicator
                key={index}
                pos={pos}
                extraMembersCount={memberCount - MAX_VISIBLE_MEMBERS}
                colorScheme={colorScheme}
              />
            );
          }
          return null;
        })}
      </G>
    </Svg>
  );
};

export default GroupAvatarSvg;

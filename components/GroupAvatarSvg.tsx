import { actionSecondaryColor, textSecondaryColor } from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import React, { useMemo, useState, useEffect } from "react";
import { useColorScheme, StyleProp, ViewStyle, Image } from "react-native";
import Svg, {
  Circle,
  Defs,
  ClipPath,
  G,
  Image as SvgImage,
  Text,
} from "react-native-svg";

type GroupAvatarSvgProps = {
  members: { uri?: string; name?: string }[];
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const getPositions = (memberCount: number, mainCircleRadius: number) => {
  switch (memberCount) {
    case 0:
      return [];
    case 1:
      return [
        { x: mainCircleRadius - 50, y: mainCircleRadius - 50, size: 100 },
      ];
    case 2:
      return [
        { x: mainCircleRadius * 0.25, y: mainCircleRadius * 0.25, size: 47 },
        { x: mainCircleRadius, y: mainCircleRadius, size: 35 },
      ];
    case 3:
      return [
        { x: mainCircleRadius * 0.27, y: mainCircleRadius * 0.27, size: 45 },
        { x: mainCircleRadius * 1.15, y: mainCircleRadius * 0.75, size: 35 },
        { x: mainCircleRadius * 0.6, y: mainCircleRadius * 1.2, size: 30 },
      ];
    case 4:
      return [
        { x: mainCircleRadius * 0.25, y: mainCircleRadius * 0.25, size: 45 },
        { x: mainCircleRadius * 1.2, y: mainCircleRadius * 0.35, size: 25 },
        { x: mainCircleRadius * 1.1, y: mainCircleRadius * 0.9, size: 35 },
        { x: mainCircleRadius * 0.5, y: mainCircleRadius * 1.2, size: 30 },
      ];
    default:
      return [
        { x: mainCircleRadius * 0.25, y: mainCircleRadius * 0.25, size: 45 },
        { x: mainCircleRadius * 1.2, y: mainCircleRadius * 0.35, size: 25 },
        { x: mainCircleRadius * 0.2, y: mainCircleRadius * 1.1, size: 15 },
        { x: mainCircleRadius * 0.5, y: mainCircleRadius * 1.2, size: 30 },
        { x: mainCircleRadius * 1.1, y: mainCircleRadius * 0.9, size: 35 },
      ];
  }
};

const SafeSvgImage: React.FC<{
  uri: string;
  x: number;
  y: number;
  size: number;
  clipPath: string;
}> = ({ uri, x, y, size, clipPath }) => {
  const [didError, setDidError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Image.getSize(
      uri,
      () => {
        if (isMounted) {
          setDidError(false);
        }
      },
      () => {
        if (isMounted) {
          setDidError(true);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [uri]);

  return (
    <>
      {!didError && (
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

const GroupAvatarSvg: React.FC<GroupAvatarSvgProps> = ({
  members,
  size = AvatarSizes.default,
  style,
}) => {
  const colorScheme = useColorScheme();
  const memberCount = members.length;
  const mainCircleRadius = 50;

  const positions = useMemo(
    () => getPositions(memberCount, mainCircleRadius),
    [memberCount]
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="groupAvatarClip">
          <Circle cx="50" cy="50" r="50" />
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
      <Circle cx="50" cy="50" r="49" fill="#E0E0E0" />
      <G clipPath="url(#groupAvatarClip)">
        {positions.map((pos, index) => {
          if (index < 4 && index < memberCount) {
            const member = members[index];
            const firstLetter = member.name
              ? member.name.charAt(0).toUpperCase()
              : "";
            return member.uri ? (
              <SafeSvgImage
                key={index}
                uri={member.uri}
                x={pos.x}
                y={pos.y}
                size={pos.size}
                clipPath={`url(#avatarClip${index})`}
              />
            ) : (
              <G key={index} x={pos.x} y={pos.y}>
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
                  y={pos.size / 2}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize={pos.size / 2}
                  fontWeight="500"
                  fill="white"
                >
                  {firstLetter}
                </Text>
              </G>
            );
          } else if (index === 4 && memberCount > 4) {
            const extraMembersCount = memberCount - 4;
            return (
              <G key={index} x={pos.x} y={pos.y}>
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
                  y={pos.size / 2}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize={pos.size / 1.7}
                  fontWeight="700"
                  fill="white"
                >
                  +{extraMembersCount}
                </Text>
              </G>
            );
          }
          return null;
        })}
      </G>
    </Svg>
  );
};

export default GroupAvatarSvg;

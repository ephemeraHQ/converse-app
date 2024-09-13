import React from "react";
import Svg, { Path } from "react-native-svg";

interface EncryptedProps {
  width?: number;
  height?: number;
  color?: string;
}

const Encrypted: React.FC<EncryptedProps> = ({
  width = 40,
  height = 40,
  color = "#000000",
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 -960 960 960" fill={color}>
      <Path d="M434.08-370h91.84l-23.43-134.15q18.84-7.67 30.55-24.07 11.7-16.4 11.7-36.65 0-26.87-18.93-45.81-18.94-18.93-45.81-18.93t-45.81 18.93q-18.93 18.94-18.93 45.81 0 20.25 11.7 36.65 11.71 16.4 30.55 24.07L434.08-370ZM480-101.18q-130.18-35.64-215.09-154.39Q180-374.31 180-519.38v-227.18l300-112.31 300 112.31v227.18q0 145.07-84.91 263.81Q610.18-136.82 480-101.18Zm0-52.67q109.28-35.3 179.51-137.48 70.23-102.18 70.23-228.05v-192.39L480-805.44l-249.74 93.67v192.39q0 125.87 70.23 228.05T480-153.85Zm0-325.77Z" />
    </Svg>
  );
};

export default Encrypted;

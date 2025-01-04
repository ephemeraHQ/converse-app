import type { ImageProps as ExpoImageProps } from "expo-image";
import { Image as ExpoImage } from "expo-image";
import { memo } from "react";

export type IImageProps = ExpoImageProps;

export const Image = memo(function Image(props: IImageProps) {
  const { style, ...rest } = props;

  return <ExpoImage style={[{}, style]} {...rest} />;
});

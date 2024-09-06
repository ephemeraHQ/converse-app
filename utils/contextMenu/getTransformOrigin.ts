import { MENU_TRANSFORM_ORIGIN_TOLERENCE } from "./contstants";
import { TransformOriginAnchorPosition } from "./types";

export const getTransformOrigin = (
  posX: number,
  itemWidth: number,
  windowWidth: number,
  bottom?: boolean
): TransformOriginAnchorPosition => {
  "worklet";
  const distanceToLeft = Math.round(posX + itemWidth / 2);
  const distanceToRight = Math.round(windowWidth - distanceToLeft);

  let position: TransformOriginAnchorPosition = bottom
    ? "bottom-right"
    : "top-right";

  const majority = Math.abs(distanceToLeft - distanceToRight);

  if (majority < MENU_TRANSFORM_ORIGIN_TOLERENCE) {
    position = bottom ? "bottom-center" : "top-center";
  } else if (distanceToLeft < distanceToRight) {
    position = bottom ? "bottom-left" : "top-left";
  }

  return position;
};

import { calculateMenuHeight } from "./calculateMenuHeight";
import { MENU_WIDTH } from "./contstants";
import { TransformOriginAnchorPosition } from "./types";

export const menuAnimationAnchor = (
  anchorPoint: TransformOriginAnchorPosition,
  itemWidth: number,
  itemLength: number,
  itemsWithSeparatorLength: number
) => {
  "worklet";
  const MenuHeight = calculateMenuHeight(itemLength, itemsWithSeparatorLength);
  const splittetAnchorName: string[] = anchorPoint.split("-");

  const Center1 = itemWidth;
  const Center2 = 0;

  const TyTop1 = -(MenuHeight / 2);
  const TyTop2 = MenuHeight / 2;

  const TxLeft1 = (MENU_WIDTH / 2) * -1;
  const TxLeft2 = (MENU_WIDTH / 2) * 1;

  return {
    beginningTransformations: {
      translateX:
        splittetAnchorName[1] === "right"
          ? -TxLeft1
          : splittetAnchorName[1] === "left"
          ? TxLeft1
          : Center1,
      translateY:
        splittetAnchorName[0] === "top"
          ? TyTop1
          : splittetAnchorName[0] === "bottom"
          ? TyTop1
          : Center2,
    },
    endingTransformations: {
      translateX:
        splittetAnchorName[1] === "right"
          ? -TxLeft2
          : splittetAnchorName[1] === "left"
          ? TxLeft2
          : Center2,
      translateY:
        splittetAnchorName[0] === "top"
          ? TyTop2
          : splittetAnchorName[0] === "bottom"
          ? -TyTop2
          : Center2,
    },
  };
};

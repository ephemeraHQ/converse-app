import { MENU_ITEM_HEIGHT } from "./ContextMenu.constants";

export const calculateMenuHeight = (itemLength: number) => {
  return MENU_ITEM_HEIGHT * itemLength;
};

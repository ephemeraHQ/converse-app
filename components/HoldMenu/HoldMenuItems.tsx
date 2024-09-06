import { MenuItemProps } from "@utils/contextMenu/types";
import React, { memo } from "react";

import { HoldMenuItem } from "./HoldMenuItem";

const MenuItemsComponent = ({ items }: { items: MenuItemProps[] }) => {
  return (
    <>
      {items.map((item: MenuItemProps, index: number) => {
        return (
          <HoldMenuItem
            key={index}
            item={item}
            isLast={items.length === index + 1}
          />
        );
      })}
    </>
  );
};

export const HoldMenuItems = memo(MenuItemsComponent);

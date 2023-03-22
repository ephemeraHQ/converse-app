import React, { ReactElement } from "react";
import { List as MaterialList } from "react-native-paper";

export type TableViewItemType = {
  id: string;
  picto: ReactElement;
  title: string;
  subtitle?: string;
  isLastItem?: boolean;
  action?: () => void;
  paddingHorizontal?: number;
};

export default function TableViewItem({
  picto,
  title,
  subtitle,
  action,
  paddingHorizontal,
}: TableViewItemType) {
  return (
    <MaterialList.Item
      title={title}
      description={subtitle}
      left={() => {
        return picto;
      }}
      onPress={action}
      style={{ paddingHorizontal }}
    />
  );
}

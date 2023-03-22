import React, { ReactElement } from "react";
import { StyleSheet } from "react-native";
import { List as MaterialList } from "react-native-paper";

export type TableViewItemType = {
  id: string;
  picto: ReactElement;
  title: string;
  subtitle?: string;
  isLastItem?: boolean;
  action?: () => void;
};

export default function TableViewItem({
  picto,
  title,
  subtitle,
  isLastItem,
  action,
}: TableViewItemType) {
  return (
    <MaterialList.Item
      title={title}
      description={subtitle}
      left={() => {
        return picto;
      }}
      onPress={action}
      style={styles.listItem}
    />
  );
}

const styles = StyleSheet.create({
  listItem: {
    paddingHorizontal: 33,
  },
});

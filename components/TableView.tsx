import React from "react";
import {
  ColorSchemeName,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";

import { backgroundColor, textSecondaryColor } from "../utils/colors";
import Picto from "./Picto/Picto";
import TableViewItem, {
  TableViewItemType,
} from "./TableViewItem/TableViewItem";

export const TableViewSymbol = ({ symbol }: { symbol: string }) => (
  <Picto
    picto={symbol}
    size={16}
    style={{ width: 32, height: 32, marginRight: 8 }}
  />
);

export const TableViewEmoji = ({ emoji }: { emoji: string }) => (
  <Text style={{ width: 32, marginRight: 2, marginLeft: 6 }}>{emoji}</Text>
);

export default function TableView({
  title,
  items,
  style,
}: {
  title?: string;
  items: TableViewItemType[];
  style?: StyleProp<ViewStyle>;
}) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View style={[styles.tableViewContainer, style]}>
      {title && <Text style={styles.tableViewTitle}>{title}</Text>}
      <View style={[styles.tableView]}>
        {items.map((e, i) => (
          <TableViewItem
            key={e.id}
            isLastItem={i === items.length - 1}
            {...e}
          />
        ))}
      </View>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    tableViewContainer: {
      marginHorizontal: 24,
    },
    tableViewTitle: {
      textTransform: "uppercase",
      color: textSecondaryColor(colorScheme),
      fontSize: 12,
      marginLeft: 16,
      marginBottom: 8,
    },
    tableView: {
      backgroundColor: backgroundColor(colorScheme),
      borderRadius: 10,
      overflow: "hidden",
    },
  });

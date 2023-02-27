import React, { ReactElement } from "react";
import {
  ColorSchemeName,
  PlatformColor,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

import {
  backgroundColor,
  itemSeparatorColor,
  tableViewItemBackground,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";

type TableViewItemType = {
  id: string;
  picto: ReactElement;
  title: string;
  subtitle?: string;
  isLastItem?: boolean;
  action?: () => void;
  styles?: ReturnType<typeof getStyles>;
};

export const TableViewSymbol = ({ symbol }: { symbol: string }) => (
  <SFSymbol
    name={symbol}
    weight="regular"
    scale="large"
    color={PlatformColor("systemBlue")}
    size={16}
    resizeMode="center"
    multicolor={false}
    style={{ width: 32, height: 32, marginRight: 8 }}
  />
);

export const TableViewEmoji = ({ emoji }: { emoji: string }) => (
  <Text style={{ width: 32, marginRight: 2, marginLeft: 6 }}>{emoji}</Text>
);

const TableViewItem = ({
  picto,
  title,
  subtitle,
  isLastItem,
  action,
  styles,
}: TableViewItemType) => {
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={action}>
      <View style={styles?.tableViewItem}>
        {picto}
        <View
          style={[
            styles?.textContainer,
            isLastItem ? styles?.textContainerLastItem : undefined,
          ]}
        >
          <Text style={styles?.tableViewItemTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles?.tableViewItemSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    tableViewContainer: {
      marginHorizontal: 18,
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
    tableViewItem: {
      backgroundColor: tableViewItemBackground(colorScheme),
      paddingLeft: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    tableViewItemTitle: {
      fontSize: 17,
      marginBottom: 2,
      color: textPrimaryColor(colorScheme),
    },
    tableViewItemSubtitle: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
    },
    textContainer: {
      borderBottomWidth: 1,
      borderBottomColor: itemSeparatorColor(colorScheme),
      flex: 1,
      paddingRight: 16,
      paddingTop: 14,
      paddingBottom: 14,
    },
    textContainerLastItem: {
      borderBottomWidth: 0,
    },
  });

import React, { ReactElement } from "react";
import {
  PlatformColor,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

type TableViewItemType = {
  id: string;
  picto: ReactElement;
  title: string;
  subtitle?: string;
  isLastItem?: boolean;
  action?: () => void;
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

const TableViewItem = ({
  picto,
  title,
  subtitle,
  isLastItem,
  action,
}: TableViewItemType) => {
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={action}>
      <View style={styles.tableViewItem}>
        {picto}
        <View
          style={[
            styles.textContainer,
            isLastItem ? styles.textContainerLastItem : undefined,
          ]}
        >
          <Text style={styles.tableViewItemTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.tableViewItemSubtitle} numberOfLines={2}>
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

const styles = StyleSheet.create({
  tableViewContainer: {
    marginHorizontal: 18,
  },
  tableViewTitle: {
    textTransform: "uppercase",
    color: "rgba(60, 60, 67, 0.6)",
    fontSize: 12,
    marginLeft: 16,
    marginBottom: 8,
  },
  tableView: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableViewItem: {
    backgroundColor: "#F2F2F6",
    paddingLeft: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  tableViewItemTitle: {
    fontSize: 17,
    marginBottom: 2,
  },
  tableViewItemSubtitle: {
    fontSize: 12,
    color: "rgba(60, 60, 67, 0.6)",
  },
  textContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#CCC",
    flex: 1,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  textContainerLastItem: {
    borderBottomWidth: 0,
  },
});

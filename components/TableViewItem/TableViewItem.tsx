import React, { ReactElement } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ColorSchemeName,
  useColorScheme,
} from "react-native";

import {
  itemSeparatorColor,
  tableViewItemBackground,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";

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
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
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
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
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

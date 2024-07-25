import {
  tertiaryBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { ReactElement } from "react";
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useColorScheme,
} from "react-native";
import {
  Cell,
  TableView as RNTableView,
  Section,
} from "react-native-tableview-simple";

export type TableViewItemType = {
  id: string;
  leftView?: ReactElement;
  rightView?: ReactElement;
  title: string;
  titleNumberOfLines?: number;
  subtitle?: string;
  action?: () => void;
  titleColor?: ColorValue;
  subtitleColor?: ColorValue;
};

type Props = {
  title?: string;
  items: TableViewItemType[];
  style?: StyleProp<ViewStyle>;
};

export default function TableView({ title, items, style }: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const separatorInsetLeft = items.length > 0 && !!items[0].leftView ? 53 : 15;
  return (
    <RNTableView style={style}>
      <Section
        header={title}
        separatorInsetLeft={separatorInsetLeft}
        hideSurroundingSeparators
        roundedCorners
        withSafeAreaView={false}
      >
        {items.map((i) => (
          <Cell
            key={i.id}
            title={i.title}
            onPress={i.action}
            backgroundColor={tertiaryBackgroundColor(colorScheme)}
            titleTextProps={{ numberOfLines: i.titleNumberOfLines || 1 }}
            titleTextStyle={[
              styles.itemTitle,
              {
                marginTop: i.subtitle ? 5 : 0,
                marginBottom: i.subtitle ? 2 : 0,
                color: i.titleColor || textPrimaryColor(colorScheme),
              },
            ]}
            cellImageView={
              i.leftView ? (
                <View style={{ marginRight: 8 }}>{i.leftView}</View>
              ) : undefined
            }
            cellAccessoryView={
              i.rightView ? (
                <View style={{ marginRight: -8, marginLeft: 8 }}>
                  {i.rightView}
                </View>
              ) : undefined
            }
            cellStyle={i.subtitle ? "Subtitle" : "Basic"}
            detail={i.subtitle}
            subtitleTextStyle={[
              styles.itemSubtitle,
              { color: i.subtitleColor || textSecondaryColor(colorScheme) },
            ]}
            withSafeAreaView={false}
          />
        ))}
      </Section>
    </RNTableView>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    itemTitle: {
      fontSize: 17,
    },
    itemSubtitle: {
      fontSize: 12,
      marginBottom: 5,
    },
  });
};

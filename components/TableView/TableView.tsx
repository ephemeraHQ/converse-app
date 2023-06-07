import { ReactElement } from "react";
import {
  ColorSchemeName,
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useColorScheme,
} from "react-native";
import {
  Cell,
  Section,
  TableView as RNTableView,
} from "react-native-tableview-simple";

import {
  tertiaryBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";

type TableViewItemType = {
  id: string;
  leftView?: ReactElement;
  rightView?: ReactElement;
  title: string;
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
  const styles = getStyles(colorScheme);
  const separatorInsetLeft = items.length > 0 && !!items[0].leftView ? 53 : 15;
  return (
    <RNTableView style={style}>
      <Section
        header={title}
        separatorInsetLeft={separatorInsetLeft}
        hideSurroundingSeparators
        roundedCorners
      >
        {items.map((i) => (
          <Cell
            key={i.id}
            title={i.title}
            onPress={i.action}
            backgroundColor={tertiaryBackgroundColor(colorScheme)}
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
                <View style={{ marginRight: -8 }}>{i.rightView}</View>
              ) : undefined
            }
            cellStyle={i.subtitle ? "Subtitle" : "Basic"}
            detail={i.subtitle}
            subtitleTextStyle={[
              styles.itemSubtitle,
              { color: i.subtitleColor || textSecondaryColor(colorScheme) },
            ]}
          />
        ))}
      </Section>
    </RNTableView>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    itemTitle: {
      fontSize: 17,
    },
    itemSubtitle: {
      fontSize: 12,
      marginBottom: 5,
    },
  });

import { ReactElement } from "react";
import {
  ColorSchemeName,
  StyleProp,
  StyleSheet,
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
              },
            ]}
            cellImageView={i.leftView}
            cellStyle={i.subtitle ? "Subtitle" : "Basic"}
            detail={i.subtitle}
            subtitleColor={textSecondaryColor(colorScheme)}
            subtitleTextStyle={styles.itemSubtitle}
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
      color: textPrimaryColor(colorScheme),
    },
    itemSubtitle: {
      marginBottom: 5,
    },
  });

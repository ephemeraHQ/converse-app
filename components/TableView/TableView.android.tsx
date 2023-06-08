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
import { List } from "react-native-paper";

import { textSecondaryColor } from "../../utils/colors";

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
  const sectionContent = items.map((i) => (
    <List.Item
      title={i.title}
      key={i.id}
      left={() => i.leftView}
      right={() => i.rightView}
      onPress={i.action}
      description={i.subtitle}
    />
  ));
  return (
    <View style={style}>
      {title ? (
        <List.Section>
          <List.Subheader style={styles.sectionTitle}>{title}</List.Subheader>
          {sectionContent}
        </List.Section>
      ) : (
        sectionContent
      )}
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    sectionTitle: {
      marginBottom: -8,
      color: textSecondaryColor(colorScheme),
      fontSize: 11,
      fontWeight: "500",
    },
  });

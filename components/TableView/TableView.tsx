import { ReactElement } from "react";
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useColorScheme,
} from "react-native";
import { List } from "react-native-paper";

import { textSecondaryColor } from "../../utils/colors";

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
  const styles = useStyles();
  const sectionContent = items.map((i) => (
    <List.Item
      title={i.title}
      titleStyle={{ color: i.titleColor }}
      titleNumberOfLines={i.titleNumberOfLines || 1}
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

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    sectionTitle: {
      marginBottom: -8,
      color: textSecondaryColor(colorScheme),
      fontSize: 11,
      fontWeight: "500",
    },
  });
};

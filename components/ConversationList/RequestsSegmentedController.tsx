import {
  tertiaryBackgroundColor,
  textPrimaryColor,
  BACKGROUND_LIGHT,
  TEXT_PRIMARY_COLOR_LIGHT,
} from "@styles/colors";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";

interface SegmentedControllerProps {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const RequestsSegmentedController: React.FC<SegmentedControllerProps> = ({
  options,
  selectedIndex,
  onSelect,
}) => {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.option,
            index === selectedIndex && styles.selectedOption,
            index === 0 && styles.firstOption,
            index === options.length - 1 && styles.lastOption,
          ]}
          onPress={() => onSelect(index)}
        >
          <Text
            style={[
              styles.optionText,
              index === selectedIndex && styles.selectedOptionText,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: tertiaryBackgroundColor(colorScheme),
      borderRadius: 8,
      padding: 2,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    option: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedOption: {
      backgroundColor: BACKGROUND_LIGHT,
      borderRadius: 6,
    },
    firstOption: {
      borderTopLeftRadius: 6,
      borderBottomLeftRadius: 6,
    },
    lastOption: {
      borderTopRightRadius: 6,
      borderBottomRightRadius: 6,
    },
    optionText: {
      fontSize: 14,
      color: textPrimaryColor(colorScheme),
    },
    selectedOptionText: {
      fontWeight: "bold",
      color: TEXT_PRIMARY_COLOR_LIGHT,
    },
  });
};

export default RequestsSegmentedController;

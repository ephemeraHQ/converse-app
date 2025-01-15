import {
  backgroundColor,
  tertiaryBackgroundColor,
  textPrimaryColor,
} from "@styles/colors";
import React from "react";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";

type IConversationRequestsListSegmentControllerProps = {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export const ConversationRequestsListSegmentController: React.FC<
  IConversationRequestsListSegmentControllerProps
> = ({ options, selectedIndex, onSelect }) => {
  const colorScheme = useColorScheme();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: tertiaryBackgroundColor(colorScheme),
        borderRadius: 8,
        padding: 2,
        height: 32,
        marginTop: 10,
        marginBottom: 2,
        marginHorizontal: 16,
      }}
    >
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            {
              flex: 1,
              paddingVertical: 6,
              alignItems: "center",
              justifyContent: "center",
            },
            index === selectedIndex && {
              backgroundColor: backgroundColor(colorScheme),
              borderRadius: 6,
            },
            index === 0 && {
              borderTopLeftRadius: 6,
              borderBottomLeftRadius: 6,
            },
            index === options.length - 1 && {
              borderTopRightRadius: 6,
              borderBottomRightRadius: 6,
            },
          ]}
          onPress={() => onSelect(index)}
        >
          <Text
            style={[
              {
                fontSize: 13,
                color: textPrimaryColor(colorScheme),
              },
              index === selectedIndex && {
                fontWeight: "500",
                color: textPrimaryColor(colorScheme),
              },
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

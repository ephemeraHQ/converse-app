import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  primary?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Button({ title, onPress, primary, style }: Props) {
  return (
    <TouchableOpacity
      style={[primary ? styles.buttonPrimary : styles.buttonSeconday, style]}
      onPress={onPress}
    >
      <Text style={primary ? styles.textPrimary : styles.textSeconday}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonPrimary: {
    backgroundColor: "#007AFF",
    display: "flex",
    alignSelf: "stretch",
    marginHorizontal: 32,
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  textPrimary: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 17,
  },
  buttonSeconday: {},
  textSeconday: {
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 17,
  },
});

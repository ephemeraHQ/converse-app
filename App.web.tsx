import "@expo/metro-runtime";
import "./polyfills";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <Text>Web Version</Text>
    </SafeAreaProvider>
  );
}

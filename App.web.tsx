import "@expo/metro-runtime";
import "./polyfills";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Main from "./screens/Main";

export default function App() {
  return (
    <SafeAreaProvider>
      <ActionSheetProvider>
        <Main />
      </ActionSheetProvider>
    </SafeAreaProvider>
  );
}

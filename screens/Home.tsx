import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import XmtpWebview from "../components/XmtpWebview";

export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <XmtpWebview />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  text: {
    flex: 1,
  },
});

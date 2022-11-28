import { useContext } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import XmtpWebview from "../components/XmtpWebview";
import { AppContext } from "../store/context";

export default function Home() {
  const { state } = useContext(AppContext);
  return (
    <SafeAreaView style={styles.safe}>
      <XmtpWebview />
      <View style={styles.text}>
        <Text>
          COUCOU {state.xmtp.connected ? "Connected" : "Not connected"}
        </Text>
      </View>
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

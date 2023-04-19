import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ColorSchemeName,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
} from "react-native";

import Ellipse from "../assets/ellipse.svg";
import config from "../config";
import { NavigationParamList } from "../screens/Main";
import { backgroundColor, textPrimaryColor } from "../utils/colors";
import Button from "./Button/Button";

type Props = {
  ctaOnly: boolean;
} & NativeStackScreenProps<NavigationParamList, "Messages">;

export default function Welcome({ ctaOnly, navigation }: Props) {
  const headerHeight = useHeaderHeight();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View
      style={
        ctaOnly
          ? styles.welcomCtaOnly
          : [
              styles.welcome,
              { paddingTop: headerHeight + Platform.OS === "ios" ? 52 : 0 },
            ]
      }
    >
      {!ctaOnly && (
        <>
          <Ellipse style={styles.ellipse} />
          <Text style={styles.title}>Thank you for choosing Converse!</Text>
          <Text style={styles.p}>
            You are now part of a small community of people who own their
            conversations.{"\n"}
            {"\n"}Here are two easy ways to get started:
          </Text>
        </>
      )}

      <View style={styles.ctaWrapper}>
        <Button
          variant="text"
          title="Say hi to Pol, one of our founders"
          textStyle={styles.cta}
          picto="hand.wave"
          onPress={() => {
            navigation.navigate("Conversation", {
              mainConversationWithPeer: config.polAddress,
            });
          }}
        />
      </View>
      <View style={styles.ctaWrapper}>
        <Button
          variant="text"
          title="Share your Converse invite link"
          textStyle={styles.cta}
          picto="square.and.arrow.up"
          onPress={() => {
            navigation.navigate("ShareProfile");
          }}
        />
      </View>
      <View style={styles.ctaWrapper}>
        <Button
          variant="text"
          title="Spread the “Ping me” initiative"
          textStyle={styles.cta}
          picto="party.popper"
          onPress={() => {
            navigation.navigate("PingMe");
          }}
        />
      </View>
      {!ctaOnly && (
        <Text style={[styles.p, { marginTop: 24 }]}>Enjoy your day!</Text>
      )}
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    welcome: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      backgroundColor: backgroundColor(colorScheme),
      paddingHorizontal: 30,
    },
    welcomCtaOnly: {
      alignItems: "center",
      backgroundColor: backgroundColor(colorScheme),
      paddingBottom: 30,
    },
    ellipse: {
      marginBottom: 40,
    },
    title: {
      marginTop: 15,
      marginBottom: 20,
      color: textPrimaryColor(colorScheme),
      textAlign: "center",
      fontWeight: "bold",
      ...Platform.select({
        default: { fontSize: 17 },
        android: { fontSize: 16 },
      }),
    },
    p: {
      color: textPrimaryColor(colorScheme),
      textAlign: "center",
      ...Platform.select({
        default: { fontSize: 17 },
        android: { fontSize: 16 },
      }),
    },
    ctaWrapper: {
      marginTop: 28,
    },
    cta: {
      fontWeight: "600",
    },
  });

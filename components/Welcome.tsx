import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { backgroundColor, textPrimaryColor } from "@styles/colors";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import Button from "./Button/Button";
import Ellipse from "../assets/ellipse.svg";
import config from "../config";
import { useRecommendationsStore } from "../data/store/accountsStore";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import { navigate } from "../utils/navigation";

type Props = {
  ctaOnly: boolean;
} & NativeStackScreenProps<NavigationParamList, any>;

export default function Welcome({ ctaOnly, navigation }: Props) {
  const frens = useRecommendationsStore((s) => s.frens);
  const headerHeight = useHeaderHeight();
  const styles = useStyles();
  const frensCount = frens ? Object.keys(frens).length : 0;
  return (
    <View
      style={
        ctaOnly
          ? styles.welcomCtaOnly
          : [
              styles.welcome,
              {
                paddingTop: Platform.OS === "ios" ? headerHeight : 0,
                height:
                  Platform.OS === "android"
                    ? Dimensions.get("screen").height - 2 * headerHeight
                    : undefined,
              },
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
            navigate("Conversation", {
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
            navigate("ShareProfile");
          }}
        />
      </View>
      <View style={styles.ctaWrapper}>
        <Button
          variant="text"
          title={`Recommended profiles${
            frensCount > 0 ? ` (${frensCount})` : ""
          }`}
          textStyle={styles.cta}
          picto="eyes"
          onPress={() => {
            navigation.navigate("ConverseMatchMaker");
          }}
        />
      </View>
      {!ctaOnly && (
        <Text style={[styles.p, { marginTop: 24 }]}>Enjoy your day!</Text>
      )}
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    welcome: {
      alignItems: "center",
      flex: Platform.OS === "ios" ? 1 : undefined,
      justifyContent: "center",
      backgroundColor: backgroundColor(colorScheme),
      paddingHorizontal: 30,
      marginTop: Platform.OS === "web" ? 60 : undefined,
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
};

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import {
  Text,
  Button,
  StyleSheet,
  Image,
  ColorSchemeName,
  useColorScheme,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";

import AndroidBackAction from "../components/AndroidBackAction";
import ConverseButton from "../components/Button/Button";
import config from "../config";
import { AppContext } from "../data/store/context";
import {
  backgroundColor,
  textPrimaryColor,
  primaryColor,
  textInputStyle,
} from "../utils/colors";
import { NavigationParamList } from "./Main";

export default function PingMeScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "PingMe">) {
  const colorScheme = useColorScheme();
  const { state } = useContext(AppContext);
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        Platform.OS === "ios" ? (
          <Button
            title="Cancel"
            onPress={() => {
              navigation.goBack();
            }}
          />
        ) : (
          <AndroidBackAction navigation={navigation} />
        ),
    });
  }, [navigation]);
  const styles = getStyles(colorScheme);
  const profileUrl = `https://${config.websiteDomain}/dm/${
    state.app.mainIdentity || state.xmtp.address
  }`;
  const textToCopy = `It’s time to own our conversations. Ping me on Converse : ${profileUrl}`;
  const [isCopied, setIsCopied] = useState(false);

  return (
    <ScrollView
      style={styles.pingMe}
      contentContainerStyle={styles.pingMeContent}
    >
      {Platform.OS === "ios" && <StatusBar hidden={false} style="light" />}
      <Image source={require("../assets/pingMePol.png")} style={styles.pol} />
      <Text style={styles.text}>
        👋 hey{"\n\n"}
        We know it’s not easy to use a new messaging app when you’re used to
        Whatsapp or Telegram.{"\n\n"}
        It would be much easier if everyone was already using Converse, had a
        wallet and an ENS address ... but that’s not the case for now!{"\n\n"}
        With my cofounder Noé, our goal is to help you own your first
        conversations. That’s how we had the idea of the “Ping me on Converse”
        initiative.{"\n\n"}
        At the bottom of this screen, you’ll find a small message that contains
        your Converse link. If people click on it, they will be able to download
        Converse and start a conversation with you.{"\n\n"}
        You can copy it and paste it wherever you want - send it to your frens
        and family, post it on Twitter, Lens or Farcaster or even use a carrier
        pigeon 🐥{"\n\n"}
        Of course there’s no pressure and you can{" "}
        <Text
          style={styles.link}
          onPress={() => {
            navigation.goBack();
            setTimeout(() => {
              navigation.navigate("Conversation", {
                mainConversationWithPeer: config.polAddress,
                focus: true,
              });
            }, 200);
          }}
        >
          ping me at polmaire.eth
        </Text>{" "}
        if you have questions.{"\n\n"}
        Pol, cofounder at Converse
      </Text>
      <TextInput
        multiline
        textAlignVertical="top"
        value={textToCopy}
        editable={false}
        style={[textInputStyle(colorScheme), styles.textToCopy]}
      />
      <ConverseButton
        variant="text"
        picto="doc.on.doc"
        title={isCopied ? "Copied!" : "Copy message"}
        textStyle={styles.copyText}
        onPress={() => {
          Clipboard.setStringAsync(textToCopy);
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, 1000);
        }}
      />
    </ScrollView>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    pingMe: {
      backgroundColor: backgroundColor(colorScheme),
    },
    pingMeContent: {
      alignItems: "center",
      paddingBottom: 50,
    },
    pol: {
      width: 100,
      height: 100,
      marginVertical: 55,
    },
    text: {
      textAlign: "center",
      paddingHorizontal: 30,
      marginBottom: 55,
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    link: {
      color: primaryColor(colorScheme),
    },
    textToCopy: {
      marginHorizontal: 24,
      marginBottom: 24,
    },
    copyText: {
      fontWeight: "600",
    },
  });

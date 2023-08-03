import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import {
  ColorSchemeName,
  Image,
  StyleSheet,
  useColorScheme,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SendButton from "../../assets/send-button.svg";
import { useAppStore } from "../../data/store/appStore";
import {
  dangerColor,
  setAndroidColors,
  setAndroidSystemColor,
} from "../../utils/colors";
import { pick } from "../../utils/objects";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import Picto from "../Picto/Picto";

export default function ChatSendAttachment() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { mediaPreview, setMediaPreview } = useAppStore((s) =>
    pick(s, ["mediaPreview", "setMediaPreview"])
  );
  const insets = useSafeAreaInsets();
  const sendMedia = useCallback(() => {
    if (mediaPreview?.mediaURI) {
      setMediaPreview({
        mediaURI: mediaPreview.mediaURI,
        error: false,
        sending: true,
      });
    }
  }, [mediaPreview?.mediaURI, setMediaPreview]);
  useEffect(() => {
    setAndroidSystemColor("#000000");
    return () => {
      setAndroidColors(colorScheme);
    };
  }, [colorScheme]);
  if (!mediaPreview) return null;
  const { sending, error } = mediaPreview;
  return (
    <View style={styles.previewContainer}>
      <StatusBar hidden={false} style="light" backgroundColor="black" />
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: mediaPreview.mediaURI }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      {Platform.OS === "ios" && (
        <Text
          style={[styles.text, styles.cancel]}
          onPress={() => {
            setMediaPreview(null);
          }}
        >
          Cancel
        </Text>
      )}
      {Platform.OS === "android" && (
        <TouchableOpacity
          onPress={() => {
            setMediaPreview(null);
          }}
        >
          <Picto
            picto="xmark"
            color="#D8C2BE"
            style={{
              width: 34,
              height: 34,
              left: 20,
              top: 20,
            }}
            size={34}
          />
        </TouchableOpacity>
      )}
      <View style={[styles.controls, { bottom: insets.bottom }]}>
        {!sending && !error && (
          <TouchableOpacity onPress={sendMedia} activeOpacity={0.6}>
            <SendButton width={36} height={36} style={styles.sendButton} />
          </TouchableOpacity>
        )}
        {sending && !error && (
          <>
            <ActivityIndicator size="small" />
            <Text style={[styles.text, { marginLeft: 10 }]}>Sending</Text>
          </>
        )}
        {error && (
          <>
            <Text style={[styles.text, { color: dangerColor(colorScheme) }]}>
              There was an error
            </Text>
            <Text style={[styles.text, { marginLeft: 10 }]} onPress={sendMedia}>
              Try again
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    previewContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      backgroundColor: "black",
    },
    imageContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      justifyContent: "center",
    },
    text: {
      color: "white",
      fontSize: 17,
    },
    cancel: {
      paddingTop: 75,
      marginBottom: 9,
      marginLeft: 16,
    },
    image: {
      height: "65%",
      width: "100%",
    },
    controls: {
      width: "100%",
      height: 50,
      alignItems: "center",
      position: "absolute",
      justifyContent: "flex-end",
      flexDirection: "row",
      right: 10,
    },
    sendButton: {
      marginTop: "auto",
      marginBottom: 6,
    },
  });

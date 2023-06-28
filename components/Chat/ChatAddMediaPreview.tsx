import { useCallback, useContext } from "react";
import {
  ColorSchemeName,
  Image,
  StyleSheet,
  useColorScheme,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SendButton from "../../assets/send-button.svg";
import { AppDispatchTypes } from "../../data/store/appReducer";
import { AppContext } from "../../data/store/context";
import { dangerColor } from "../../utils/colors";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";

export default function ChatAddMediaPreview() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { state, dispatch } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const { mediaURI, sending, error } = state.app.mediaPreview;
  const sendMedia = useCallback(() => {
    dispatch({
      type: AppDispatchTypes.AppSetMediaPreview,
      payload: { mediaURI, error: false, sending: true },
    });
  }, [dispatch, mediaURI]);
  if (!mediaURI) return null;
  return (
    <View style={styles.previewContainer}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: state.app.mediaPreview.mediaURI }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <Text
        style={[styles.text, styles.cancel]}
        onPress={() => {
          dispatch({
            type: AppDispatchTypes.AppSetMediaPreview,
            payload: { mediaURI: undefined, error: false, sending: false },
          });
        }}
      >
        Cancel
      </Text>
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

import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useCallback } from "react";
import { ColorSchemeName, StyleSheet, useColorScheme } from "react-native";
import ParsedText from "react-native-parsed-text";

import { actionSheetColors } from "../utils/colors";
import {
  URL_REGEX,
  ADDRESS_REGEX,
  LENS_REGEX,
  ETH_REGEX,
} from "../utils/regex";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

type Props = {
  children: string;
};

export default function ClickableText({ children }: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const handleEmailPress = useCallback((email: string) => {
    try {
      Linking.openURL(`mailto:${email}`);
    } catch {}
  }, []);
  const handleUrlPress = useCallback((url: string) => {
    const uri = url.toLowerCase().startsWith("http") ? url : `https://${url}`;

    Linking.openURL(uri);
  }, []);
  const handleNewConversationPress = useCallback((peer: string) => {
    Linking.openURL(
      Linking.createURL("/newConversation", {
        queryParams: {
          peer,
        },
      })
    );
  }, []);

  const showCopyActionSheet = useCallback(
    (cta: string) => (content: string) => {
      const methods = {
        [cta]: () => {
          Clipboard.setStringAsync(content);
        },
        Cancel: () => {},
      };

      const options = Object.keys(methods);

      showActionSheetWithOptions(
        {
          options,
          title: content,
          cancelButtonIndex: options.indexOf("Cancel"),
          ...actionSheetColors(colorScheme),
        },
        (selectedIndex?: number) => {
          if (selectedIndex === undefined) return;
          const method = (methods as any)[options[selectedIndex]];
          if (method) {
            method();
          }
        }
      );
    },
    [colorScheme]
  );
  return (
    <ParsedText
      accessibilityRole="link"
      parse={[
        {
          onPress: handleEmailPress,
          onLongPress: showCopyActionSheet("Copy email"),
          style: styles.text,
          type: "email",
        },
        {
          onPress: handleUrlPress,
          onLongPress: showCopyActionSheet("Copy link"),
          pattern: URL_REGEX,
          style: styles.text,
        },
        {
          onPress: handleNewConversationPress,
          onLongPress: showCopyActionSheet("Copy wallet address"),
          pattern: ADDRESS_REGEX,
          style: styles.text,
        },
        {
          onPress: handleNewConversationPress,
          onLongPress: showCopyActionSheet("Copy lens handle"),
          pattern: LENS_REGEX,
          style: styles.text,
        },
        {
          onPress: handleNewConversationPress,
          onLongPress: showCopyActionSheet("Copy ENS name"),
          pattern: ETH_REGEX,
          style: styles.text,
        },
      ]}
    >
      {children}
    </ParsedText>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    text: {},
  });

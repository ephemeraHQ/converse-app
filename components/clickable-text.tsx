import Clipboard from "@react-native-clipboard/clipboard"
import * as Linking from "expo-linking"
import { useCallback } from "react"
import { StyleProp, StyleSheet, TextStyle } from "react-native"
import { ParsedText } from "@/components/parsed-text/parsed-text"
import {
  ADDRESS_REGEX,
  CB_ID_REGEX,
  EMAIL_REGEX,
  ENS_REGEX,
  FARCASTER_REGEX,
  LENS_REGEX,
  UNS_REGEX,
  URL_REGEX,
} from "../utils/regex"
import { showActionSheet } from "./action-sheet"

type Props = {
  children: React.ReactNode
  style?: StyleProp<TextStyle>
}

export function ClickableText({ children, style }: Props) {
  const styles = useStyles()

  const handleEmailPress = useCallback((email: string) => {
    try {
      Linking.openURL(`mailto:${email}`)
    } catch {}
  }, [])

  const handleUrlPress = useCallback((url: string) => {
    const uri = url.toLowerCase().startsWith("http") ? url : `https://${url}`
    Linking.openURL(uri)
  }, [])

  const handleNewConversationPress = useCallback((peer: string) => {
    // TODO
  }, [])

  const showCopyActionSheet = useCallback(
    (cta: string) => (content: string) => {
      const methods = {
        [cta]: () => {
          Clipboard.setString(content)
        },
        Cancel: () => {},
      }

      const options = Object.keys(methods)

      showActionSheet({
        options: {
          options,
          title: content,
          cancelButtonIndex: options.indexOf("Cancel"),
        },
        callback: (selectedIndex?: number) => {
          if (selectedIndex === undefined) return
          const method = (methods as any)[options[selectedIndex]]
          if (method) {
            method()
          }
        },
      })
    },
    [],
  )

  return (
    <ParsedText
      accessibilityRole="link"
      style={style}
      parse={[
        {
          onPress: handleNewConversationPress,
          onLongPress: showCopyActionSheet("Copy wallet address"),
          pattern: ADDRESS_REGEX,
          style: styles.clickableText,
        },
        {
          onPress: handleNewConversationPress,
          onLongPress: showCopyActionSheet("Copy lens handle"),
          pattern: LENS_REGEX,
          style: styles.clickableText,
        },
        {
          onPress: handleNewConversationPress,
          onLongPress: showCopyActionSheet("Copy ENS name"),
          pattern: ENS_REGEX,
          style: styles.clickableText,
        },
        {
          onPress: handleNewConversationPress,
          onLongPress: showCopyActionSheet("Copy Coinbase ID"),
          pattern: CB_ID_REGEX,
          style: styles.clickableText,
        },
        {
          onPress: handleNewConversationPress,
          onLongPress: showCopyActionSheet("Copy Unstoppable domain"),
          pattern: UNS_REGEX,
          style: styles.clickableText,
        },
        {
          onPress: handleNewConversationPress,
          onLongPress: showCopyActionSheet("Copy Farcaster username"),
          pattern: FARCASTER_REGEX,
          style: styles.clickableText,
        },
        {
          onPress: handleEmailPress,
          onLongPress: showCopyActionSheet("Copy email"),
          pattern: EMAIL_REGEX,
          style: styles.clickableText,
        },
        {
          onPress: handleUrlPress,
          onLongPress: showCopyActionSheet("Copy link"),
          pattern: URL_REGEX,
          style: styles.clickableText,
        },
      ]}
    >
      {children}
    </ParsedText>
  )
}

const useStyles = () => {
  return StyleSheet.create({
    clickableText: { textDecorationLine: "underline" },
  })
}

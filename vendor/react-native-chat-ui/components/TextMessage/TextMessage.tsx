import {
  LinkPreview,
  PreviewData,
  REGEX_LINK,
} from "@flyerhq/react-native-link-preview";
import * as Clipboard from "expo-clipboard";

import * as React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import * as Linking from "expo-linking";

import ParsedText from "react-native-parsed-text";

import { MessageType } from "../../types";
import {
  excludeDerivedMessageProps,
  getUserName,
  ThemeContext,
  UserContext,
} from "../../utils";
import styles from "./styles";
import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  ADDRESS_REGEX,
  ETH_REGEX,
  LENS_REGEX,
  URL_REGEX,
} from "../../../../utils/regex";
import { AppContext } from "../../../../data/store/context";
import { blockPeer, reportMessage } from "../../../../utils/api";
import { XmtpDispatchTypes } from "../../../../data/store/xmtpReducer";

export interface TextMessageTopLevelProps {
  /** @see {@link LinkPreviewProps.onPreviewDataFetched} */
  onPreviewDataFetched?: ({
    message,
    previewData,
  }: {
    message: MessageType.Text;
    previewData: PreviewData;
  }) => void;
  /** Enables link (URL) preview */
  usePreviewData?: boolean;
}

export interface TextMessageProps extends TextMessageTopLevelProps {
  enableAnimation?: boolean;
  message: MessageType.DerivedText;
  messageWidth: number;
  showName: boolean;
  currentUserIsAuthor: boolean;
}

export const TextMessage = ({
  enableAnimation,
  message,
  messageWidth,
  onPreviewDataFetched,
  showName,
  usePreviewData,
  currentUserIsAuthor,
}: TextMessageProps) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const theme = React.useContext(ThemeContext);
  const user = React.useContext(UserContext);
  const [previewData, setPreviewData] = React.useState(message.previewData);
  const { descriptionText, headerText, titleText, text, textContainer } =
    styles({
      message,
      theme,
      user,
    });

  const handleEmailPress = React.useCallback((email: string) => {
    try {
      Linking.openURL(`mailto:${email}`);
    } catch {}
  }, []);

  const handlePreviewDataFetched = React.useCallback((data: PreviewData) => {
    setPreviewData(data);
    onPreviewDataFetched?.({
      // It's okay to cast here since we know it is a text message
      // type-coverage:ignore-next-line
      message: excludeDerivedMessageProps(message) as MessageType.Text,
      previewData: data,
    });
  }, []);

  const handleUrlPress = React.useCallback((url: string) => {
    const uri = url.toLowerCase().startsWith("http") ? url : `https://${url}`;

    Linking.openURL(uri);
  }, []);

  const renderPreviewDescription = React.useCallback((description: string) => {
    return (
      <Text numberOfLines={3} style={descriptionText}>
        {description}
      </Text>
    );
  }, []);

  const renderPreviewHeader = React.useCallback((header: string) => {
    return (
      <Text numberOfLines={1} style={headerText}>
        {header}
      </Text>
    );
  }, []);

  const handleNewConversationPress = React.useCallback((peer: string) => {
    Linking.openURL(
      Linking.createURL("/newConversation", {
        queryParams: {
          peer,
        },
      })
    );
  }, []);

  const showCopyActionSheet = React.useCallback(
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
    []
  );

  const { dispatch } = React.useContext(AppContext);

  const report = React.useCallback(async () => {
    reportMessage({
      messageId: message.id,
      messageContent: message.text,
      messageSender: message.author.id,
    });

    Alert.alert("Message reported");
  }, []);

  const reportAndBlock = React.useCallback(async () => {
    reportMessage({
      messageId: message.id,
      messageContent: message.text,
      messageSender: message.author.id,
    });
    blockPeer({ peerAddress: message.author.id, blocked: true });
    dispatch({
      type: XmtpDispatchTypes.XmtpSetBlockedStatus,
      payload: { peerAddress: message.author.id, blocked: true },
    });
  }, []);

  const showMessageReportActionSheet = React.useCallback(() => {
    const methods = {
      Report: report,
      "Report and block": reportAndBlock,
      Cancel: () => {},
    };

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: "Report this message",
        message:
          "This message will be forwarded to Converse. The contact will not be informed.",
        cancelButtonIndex: options.indexOf("Cancel"),
        destructiveButtonIndex: [0, 1],
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const method = (methods as any)[options[selectedIndex]];
        if (method) {
          method();
        }
      }
    );
  }, []);

  const showMessageActionSheet = React.useCallback(() => {
    const methods: any = {
      "Copy message": () => {
        Clipboard.setStringAsync(message.text);
      },
    };
    if (!currentUserIsAuthor) {
      methods["Report message"] = showMessageReportActionSheet;
    }
    methods.Cancel = () => {};

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: message.text,
        cancelButtonIndex: options.indexOf("Cancel"),
        destructiveButtonIndex: currentUserIsAuthor ? undefined : 1,
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const method = (methods as any)[options[selectedIndex]];
        if (method) {
          method();
        }
      }
    );
  }, []);

  const renderPreviewText = React.useCallback((previewText: string) => {
    return (
      <ParsedText
        accessibilityRole="link"
        parse={[
          {
            onPress: handleEmailPress,
            onLongPress: showCopyActionSheet("Copy email"),
            style: [text, { textDecorationLine: "underline" }],
            type: "email",
          },
          {
            onPress: handleUrlPress,
            onLongPress: showCopyActionSheet("Copy link"),
            pattern: URL_REGEX,
            style: [text, { textDecorationLine: "underline" }],
          },
          {
            onPress: handleNewConversationPress,
            onLongPress: showCopyActionSheet("Copy wallet address"),
            pattern: ADDRESS_REGEX,
            style: [text, { textDecorationLine: "underline" }],
          },
          {
            onPress: handleNewConversationPress,
            onLongPress: showCopyActionSheet("Copy lens handle"),
            pattern: LENS_REGEX,
            style: [text, { textDecorationLine: "underline" }],
          },
          {
            onPress: handleNewConversationPress,
            onLongPress: showCopyActionSheet("Copy ENS name"),
            pattern: ETH_REGEX,
            style: [text, { textDecorationLine: "underline" }],
          },
        ]}
        style={text}
      >
        {previewText}
      </ParsedText>
    );
  }, []);

  const renderPreviewTitle = React.useCallback((title: string) => {
    return (
      <Text numberOfLines={2} style={titleText}>
        {title}
      </Text>
    );
  }, []);

  return usePreviewData &&
    !!onPreviewDataFetched &&
    REGEX_LINK.test(message.text.toLowerCase()) ? (
    <LinkPreview
      containerStyle={{ width: previewData?.image ? messageWidth : undefined }}
      enableAnimation={enableAnimation}
      header={showName ? getUserName(message.author) : undefined}
      onPreviewDataFetched={handlePreviewDataFetched}
      previewData={previewData}
      renderDescription={renderPreviewDescription}
      renderHeader={renderPreviewHeader}
      renderText={renderPreviewText}
      renderTitle={renderPreviewTitle}
      text={message.text}
      textContainerStyle={textContainer}
      touchableWithoutFeedbackProps={{
        accessibilityRole: undefined,
        accessible: false,
        disabled: true,
      }}
    />
  ) : (
    <TouchableOpacity activeOpacity={1} onLongPress={showMessageActionSheet}>
      <View style={textContainer}>
        {
          // Tested inside the link preview
          /* istanbul ignore next */ showName
            ? renderPreviewHeader(getUserName(message.author))
            : null
        }

        <Text style={text}>{renderPreviewText(message.text)}</Text>
      </View>
    </TouchableOpacity>
  );
};

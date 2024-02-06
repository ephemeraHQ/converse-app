import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  TagsForURL,
  getFrameButtons,
  getMetadaTagsForMessage,
} from "../../utils/frames";
import { MessageToDisplay } from "./ChatMessage";

type Props = {
  message: MessageToDisplay;
};

export default function ChatMessageFramePreviews({ message }: Props) {
  const [tagsForURLs, setTagsForURLs] = useState<TagsForURL[]>([]);

  useEffect(() => {
    getMetadaTagsForMessage(message).then(setTagsForURLs);
  }, [message]);

  return (
    <View>
      {tagsForURLs.map((tagsForURL) => {
        if (tagsForURL.type === "FRAME" || tagsForURL.type === "XMTP_FRAME") {
          return (
            <ChatMessageFramePreview
              tagsForURL={tagsForURL}
              key={tagsForURL.url}
            />
          );
        }
        return null;
      })}
    </View>
  );
}

const ChatMessageFramePreview = ({
  tagsForURL,
}: {
  tagsForURL: TagsForURL;
}) => {
  const styles = useStyles();
  const buttons = getFrameButtons(tagsForURL);
  return (
    <View style={styles.frameWrapper}>
      <View style={styles.frameContainer}>
        <Image
          source={{ uri: tagsForURL.extractedTags["fc:frame:image"] }}
          contentFit="cover"
          style={styles.frameImage}
        />
        {buttons.length > 0 && (
          <View style={styles.frameButtons}>
            {buttons.map((title, i) => (
              <View
                key={`${title}-${i}`}
                style={[
                  styles.frameButton,
                  { marginRight: i % 2 === 0 ? "4%" : 0 },
                ]}
              >
                <Text style={styles.frameButtonText}>{title}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    frameWrapper: {
      padding: 4,
      paddingBottom: 0,
    },
    frameContainer: {
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      width: "100%",
      overflow: "hidden",
    },
    frameImage: { aspectRatio: 1.91, width: "100%" },
    frameButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingTop: 3,
      paddingBottom: 6,
      paddingHorizontal: 8,
      backgroundColor: "#D2523C",
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
    },
    frameButton: {
      backgroundColor: "white",
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 4,
      marginVertical: 4,
      width: "48%",
    },
    frameButtonText: {
      textAlign: "center",
    },
  });
};

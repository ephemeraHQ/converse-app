import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { StyleSheet } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

export default function FrameImage({
  frameImage,
  frameImageAspectRatio,
  linkToOpen,
  useMemoryCache,
}: {
  frameImage: string | undefined;
  frameImageAspectRatio: string;
  linkToOpen: string;
  useMemoryCache: boolean;
}) {
  const styles = useStyles();
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (linkToOpen && linkToOpen.toLowerCase().startsWith("http")) {
          Linking.openURL(linkToOpen);
        }
      }}
    >
      <Image
        // Adding a uniqueId so when a new frame comes in
        // we always reload the image and don't get stale image
        // from cache
        source={{ uri: frameImage }}
        contentFit="cover"
        // We use no cache for first image (manually handled)
        // and memory cache for following images
        cachePolicy={useMemoryCache ? "memory" : "none"}
        style={[
          styles.frameImage,
          { aspectRatio: frameImageAspectRatio === "1:1" ? 1 : 1.91 },
        ]}
      />
    </TouchableWithoutFeedback>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    frameImage: {
      width: "100%",
    },
  });
};

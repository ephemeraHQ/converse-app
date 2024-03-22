import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { StyleSheet } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

export default function FrameImage({
  frameImage,
  frameImageAspectRatio,
  linkToOpen,
}: {
  frameImage: string;
  frameImageAspectRatio: string;
  linkToOpen: string;
}) {
  const styles = useStyles();
  if (!frameImage) return null;

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (linkToOpen && linkToOpen.startsWith("http")) {
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
        // Enable memory cache because image was just prefetched
        cachePolicy="memory"
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

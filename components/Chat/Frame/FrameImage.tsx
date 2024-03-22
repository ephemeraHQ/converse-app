import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { StyleSheet } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

export default function FrameImage({
  frameImage,
  frameImageAspectRatio,
  initialFrameURL,
  uniqueId,
  setImageLoading,
}: {
  frameImage: string;
  frameImageAspectRatio: string;
  initialFrameURL: string;
  uniqueId: string;
  setImageLoading: (loading: boolean) => void;
}) {
  const styles = useStyles();
  if (!frameImage) return null;

  const frameImageURL = new URL(frameImage);
  frameImageURL.searchParams.set("converseRequestId", uniqueId);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (initialFrameURL && initialFrameURL.startsWith("http")) {
          Linking.openURL(initialFrameURL);
        }
      }}
    >
      <Image
        // Adding a uniqueId so when a new frame comes in
        // we always reload the image and don't get stale image
        // from cache
        source={{ uri: frameImageURL.toString() }}
        contentFit="cover"
        // Also disable cache so we always refetch the initial image
        cachePolicy="none"
        style={[
          styles.frameImage,
          { aspectRatio: frameImageAspectRatio === "1:1" ? 1 : 1.91 },
        ]}
        onLoadEnd={() => {
          setImageLoading(false);
        }}
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

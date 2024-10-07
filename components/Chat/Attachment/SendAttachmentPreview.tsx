import {
  setAndroidColors,
  setAndroidSystemColor,
} from "@styles/colors/helpers";
import { PictoSizes } from "@styles/sizes";
import { Image } from "expo-image";
import { useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

import ActivityIndicator from "../../ActivityIndicator/ActivityIndicator";
import Picto from "../../Picto/Picto";

type SendAttachmentPreviewProps = {
  currentAttachmentMediaURI: string;
  onClose: () => void;
  isLoading: boolean;
  error: boolean;
  scale: Animated.SharedValue<number>;
  isLandscape: boolean;
};

export default function SendAttachmentPreview({
  currentAttachmentMediaURI,
  onClose,
  isLoading,
  error,
  scale,
  isLandscape,
}: SendAttachmentPreviewProps) {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  useEffect(() => {
    setAndroidSystemColor("#000000");
    return () => {
      setAndroidColors(colorScheme);
    };
  }, [colorScheme]);
  if (!currentAttachmentMediaURI) return null;
  return (
    <View
      style={[
        styles.previewContainer,
        isLandscape
          ? styles.previewContainerLandscape
          : styles.previewContainerPortrait,
      ]}
    >
      <View
        style={
          isLandscape
            ? styles.imageContainerLandscape
            : styles.imageContainerPortrait
        }
      >
        <Image
          source={{ uri: currentAttachmentMediaURI }}
          style={isLandscape ? styles.imageLandscape : styles.imagePortrait}
          contentFit="cover"
        />
        {isLoading && (
          <View style={styles.overlay}>
            <ActivityIndicator
              size="small"
              color="#ffffff"
              style={styles.activityIndicator}
            />
          </View>
        )}
      </View>
      <Animated.View
        style={[
          styles.closeButton,
          {
            transform: [{ scale }],
            opacity: scale,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            onClose();
          }}
          hitSlop={10}
        >
          <Picto
            picto="xmark"
            color="white"
            size={PictoSizes.cancelAttachmentButton}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    previewContainer: {
      borderRadius: 4,
      position: "relative",
      overflow: "hidden",
    },
    previewContainerPortrait: {
      aspectRatio: 0.75,
      maxHeight: 120,
    },
    previewContainerLandscape: {
      aspectRatio: 1.33,
      maxHeight: 90,
    },
    imageContainerPortrait: {
      maxHeight: 120,
      position: "relative",
    },
    imageContainerLandscape: {
      maxHeight: 90,
      position: "relative",
    },
    imagePortrait: {
      width: "100%",
      height: "100%",
      maxHeight: 120,
    },
    imageLandscape: {
      width: "100%",
      height: "100%",
      maxHeight: 90,
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
    closeButton: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 18,
      height: 18,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
      padding: 2,
      borderColor: "white",
      borderWidth: 1,
      backgroundColor: "black",
      borderRadius: 12,
    },
    activityIndicator: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: [{ translateX: -12 }, { translateY: -12 }],
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
  });
};

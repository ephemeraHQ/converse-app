import Picto from "@components/Picto/Picto";
import {
  inversePrimaryColor,
  primaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { Paddings, Margins, BorderRadius } from "@styles/sizes";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ColorSchemeName,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  Platform,
} from "react-native";

type BannerProps = {
  title: string;
  description: string;
  cta?: string;

  onButtonPress?: () => void;

  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
};

const Banner: React.FC<BannerProps> = ({
  title,
  description,
  cta,
  onButtonPress,
  onDismiss,
  style,
  onLayout,
}) => {
  const colorScheme = useColorScheme();
  const styles = useStyles(colorScheme);

  return (
    <View style={[styles.banner, style]} onLayout={onLayout}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {cta && (
        <TouchableOpacity
          onPress={onButtonPress}
          style={styles.ctaButton}
          accessibilityLabel={cta}
        >
          <Text style={styles.ctaButtonText}>{cta}</Text>
          <Picto
            picto="arrow.right.circle.fill"
            size={Platform.OS === "ios" ? 14 : 20}
            color={primaryColor(colorScheme)}
            style={styles.ctaPicto}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={onDismiss}
        style={styles.dismissButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Picto
          picto="xmark.circle.fill"
          size={Platform.OS === "ios" ? 14 : 20}
          color={inversePrimaryColor(colorScheme)}
        />
      </TouchableOpacity>
    </View>
  );
};

const useStyles = (colorScheme: ColorSchemeName) => {
  return StyleSheet.create({
    banner: {
      backgroundColor: primaryColor(colorScheme),
      padding: Paddings.default,
      borderRadius: BorderRadius.default,
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      margin: Margins.default,
    },
    textContainer: {},
    title: {
      color: inversePrimaryColor(colorScheme),
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: Margins.small,
      letterSpacing: -0.2,
    },
    description: {
      color: textSecondaryColor(colorScheme === "dark" ? "light" : "dark"),
      fontSize: 14,
      letterSpacing: -0.3,
      textAlign: "center",
      marginBottom: Margins.default,
    },
    dismissButtonContainer: {},
    dismissButton: {
      position: "absolute",
      top: Platform.OS === "ios" ? Margins.large : Margins.default,
      right: Platform.OS === "ios" ? Margins.large : Margins.default,
      zIndex: 1000,
    },
    ctaButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: inversePrimaryColor(colorScheme),
      borderRadius: BorderRadius.xLarge,
      paddingHorizontal: Paddings.default,
      paddingVertical: Paddings.default - 6,
    },
    ctaButtonText: {
      fontSize: 14,
      fontWeight: "bold",
      color: primaryColor(colorScheme),
    },
    ctaPicto: {
      marginRight: Platform.OS === "ios" ? Margins.small + 2 : 0,
      marginLeft: Platform.OS === "ios" ? Margins.default + 2 : Margins.small,
    },
  });
};

export default Banner;

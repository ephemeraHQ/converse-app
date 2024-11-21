import React from "react";
import { Platform, TextStyle } from "react-native";
import { useAppTheme, ThemedStyle } from "@theme/useAppTheme";
import { useRouter } from "@navigation/useNavigation";
import { translate } from "@i18n";
import { Text } from "@design-system/Text";

export default function NoResult() {
  const { themed } = useAppTheme();
  const router = useRouter();

  return (
    <>
      <Text size="xl" style={themed($bigEmoji)}>
        👀
      </Text>
      <Text preset="small" style={themed($notFoundText)}>
        <Text>{translate("no_results")} </Text>
        <Text
          weight="bold"
          size="sm"
          onPress={() => {
            router.navigate("NewConversation", {});
          }}
        >
          {translate("no_results_start_convo")}
        </Text>
      </Text>
    </>
  );
}

const $bigEmoji: ThemedStyle<TextStyle> = ({ spacing }) => ({
  ...Platform.select({
    default: {
      textAlign: "center",
      marginTop: spacing["6xl"],
      marginBottom: spacing.sm,
    },
    android: {
      display: "none",
    },
  }),
});

const $notFoundText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  ...Platform.select({
    default: {
      textAlign: "center",
      paddingHorizontal: spacing.xl,
    },
    android: {
      textAlign: "left",
      paddingTop: spacing.xs,
      paddingHorizontal: spacing.md,
    },
  }),
});

import { translate } from "@i18n";
import {
  actionSecondaryColor,
  requestsTextColor,
  textSecondaryColor,
} from "@styles/colors";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { useRouter } from "../../navigation/useNavigation";

type IRequestsButtonProps = {
  requestsCount: number;
};

export default function RequestsButton({
  requestsCount,
}: IRequestsButtonProps) {
  const router = useRouter();
  const styles = useStyles();

  return (
    <Pressable
      key="requests"
      onPress={() => router.navigate("ChatsRequests")}
      style={styles.requestsHeader}
    >
      {({ pressed }) => (
        <View>
          <Text
            style={[
              styles.requestsCount,
              requestsCount === 0 && styles.zeroRequests,
              pressed && styles.pressedText,
            ]}
          >
            {requestsCount === 0
              ? translate("requests")
              : `${translate("requests")} (${requestsCount})`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    requestsHeader: {
      ...Platform.select({
        android: {
          paddingLeft: 24,
        },
      }),
    },
    requestsCount: {
      fontWeight: "500",
      color: requestsTextColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 14,
          marginBottom: 3,
        },
        android: {
          marginRight: 1,
          fontSize: 11,
        },
      }),
    },
    zeroRequests: {
      color: textSecondaryColor(colorScheme),
    },
    pressedText: {
      color: actionSecondaryColor(colorScheme),
    },
  });
};

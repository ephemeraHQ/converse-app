import { Alert } from "react-native";

export const awaitableAlert = async (title: string, message?: string) => {
  await new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: "Ok",
          onPress: () => {
            resolve("YES");
          },
        },
      ],
      { cancelable: false }
    );
  });
};

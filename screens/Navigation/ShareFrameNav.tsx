import { useRef } from "react";
import { Button, Platform, TextInput } from "react-native";

import { NativeStack } from "./Navigation";
import AndroidBackAction from "../../components/AndroidBackAction";
import ConversationList from "../ConversationList";

export type ShareFrameNavParams = {
  frameURL: string;
};

export default function ShareFrameNav() {
  const searchBar = useRef<TextInput | null>(null);
  return (
    <NativeStack.Screen
      name="ShareFrame"
      options={({ navigation }) => ({
        headerTitle: "Share Frame",
        presentation: "modal",
        headerLeft: (props) =>
          Platform.OS === "ios" ? (
            <Button
              title="Cancel"
              onPress={() => {
                navigation.goBack();
              }}
            />
          ) : (
            <AndroidBackAction navigation={navigation} />
          ),
      })}
    >
      {(navigationProps) => (
        <ConversationList {...navigationProps} searchBarRef={searchBar} />
      )}
    </NativeStack.Screen>
  );
}

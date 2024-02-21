import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import Button from "../../components/Button/Button";
import TableView from "../../components/TableView/TableView";
import { currentAccount } from "../../data/store/accountsStore";
import { backgroundColor } from "../../utils/colors";
import { navigate } from "../../utils/navigation";
import { getPreferredName } from "../../utils/profile";
import { createGroup } from "../../utils/xmtpRN/conversations";
import { useIsSplitScreen } from "../Navigation/navHelpers";
import { NewConversationModalParams } from "./NewConversationModal";

export default function NewGroupSummary({
  route,
  navigation,
}: NativeStackScreenProps<NewConversationModalParams, "NewGroupSummary">) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [creatingGroup, setCreatingGroup] = useState(false);
  const isSplitScreen = useIsSplitScreen();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        creatingGroup ? (
          <ActivityIndicator style={{ marginRight: 5 }} />
        ) : (
          <Button
            variant="text"
            title="Create"
            onPress={async () => {
              setCreatingGroup(true);
              const groupTopic = await createGroup(
                currentAccount(),
                route.params.members.map((m) => m.address)
              );
              if (Platform.OS !== "web") {
                navigation.getParent()?.goBack();
              }
              setTimeout(
                () => {
                  navigate("Conversation", {
                    topic: groupTopic,
                    focus: true,
                  });
                },
                isSplitScreen ? 0 : 300
              );
            }}
          />
        ),
    });
  }, [creatingGroup, isSplitScreen, navigation, route.params.members]);

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <TableView
        items={route.params.members.map((a) => ({
          id: a.address,
          title: getPreferredName(a, a.address),
        }))}
        title="MEMBERS"
      />
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    group: {
      backgroundColor: backgroundColor(colorScheme),
    },
    groupContent: {
      paddingHorizontal:
        Platform.OS === "ios" || Platform.OS === "web" ? 18 : 0,
    },
  });
};

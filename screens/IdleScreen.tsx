import { useLogout } from "@/utils/logout";
import { memo } from "react";
import { SafeAreaView } from "react-native";
import { Text, Button } from "react-native-paper";

export const IdleScreen = memo(function IdleScreen() {
  const { logout } = useLogout();
  return (
    <SafeAreaView>
      <Text>IdleScreen</Text>
      <Button mode="contained" onPress={logout}>
        Logout
      </Button>
    </SafeAreaView>
  );
});

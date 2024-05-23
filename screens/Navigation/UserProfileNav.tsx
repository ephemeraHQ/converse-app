import UserProfile from "../../components/Onboarding/UserProfile";
import { NativeStack } from "./Navigation";

export default function UserProfileNav() {
  return (
    <NativeStack.Screen
      name="UserProfile"
      component={UserProfile}
      options={{ headerTitle: "Modify profile" }}
    />
  );
}

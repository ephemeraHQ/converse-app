import NewGroupSummary from "../NewConversation/NewGroupSummary";
import { NativeStack } from "./Navigation";

export default function NewGroupSummaryNav() {
  return (
    <NativeStack.Screen
      name="NewGroupSummary"
      component={NewGroupSummary}
      options={{
        headerTitle: "New group",
      }}
    />
  );
}

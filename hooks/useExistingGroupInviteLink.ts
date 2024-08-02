import { useChatStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";

export const useExistingGroupInviteLink = (topic: string) => {
  const { groupInviteLinks } = useChatStore(useSelect(["groupInviteLinks"]));
  return groupInviteLinks[topic];
};

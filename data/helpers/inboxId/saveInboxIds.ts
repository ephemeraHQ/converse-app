import { getInboxIdStore } from "@features/accounts/accounts.store";
import { Member } from "@xmtp/react-native-sdk";

export const saveMemberInboxIds = (account: string, members: Member[]) => {
  getInboxIdStore(account).getState().addMembers(members);
};

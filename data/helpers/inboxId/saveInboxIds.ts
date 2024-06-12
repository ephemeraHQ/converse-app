import { Member } from "@xmtp/react-native-sdk";

import { getInboxIdStore } from "../../store/accountsStore";

export const saveMemberInboxIds = (account: string, members: Member[]) => {
  getInboxIdStore(account).getState().addMembers(members);
};

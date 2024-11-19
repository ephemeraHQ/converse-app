import { useCurrentAccount } from "@data/store/accountsStore";
import {
  GroupMembersSelectData,
  useGroupMembersConversationScreenQuery,
} from "@queries/useGroupMembersQuery";
import { useGroupNameQuery } from "@queries/useGroupNameQuery";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import React, { useMemo } from "react";
import { createContext, useContextSelector } from "use-context-selector";
import { useConversationContext } from "./conversation-context";

type IConversationGroupContextType = {
  groupName: string | undefined;
  groupPhoto: string | undefined;
  members: GroupMembersSelectData | undefined;
};

type IConversationGroupContextProps = {
  children: React.ReactNode;
};

const ConversationGroupContext = createContext<IConversationGroupContextType>(
  {} as IConversationGroupContextType
);

export const ConversationGroupContextProvider = (
  props: IConversationGroupContextProps
) => {
  const { children } = props;

  const topic = useConversationContext("topic");
  const currentAccount = useCurrentAccount()!;

  const { data: groupName, isLoading: groupNameLoading } = useGroupNameQuery(
    currentAccount,
    topic!
  );
  //   const { data: groupPhoto, isLoading: groupPhotoLoading } = useGroupPhotoQuery(
  //     currentAccount,
  //     topic!
  //   );
  const { data: members, isLoading: membersLoading } =
    useGroupMembersConversationScreenQuery(currentAccount, topic!);

  const value = useMemo(() => {}, []);

  return (
    <ConversationGroupContext.Provider value={value}>
      {children}
    </ConversationGroupContext.Provider>
  );
};

export const useConversationGroupContext = <
  K extends keyof IConversationGroupContextType,
>(
  key: K
) => useContextSelector(ConversationGroupContext, (s) => s[key]);

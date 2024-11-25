import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupNameQuery } from "@queries/useGroupNameQuery";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import React, { useMemo } from "react";
import { createContext, useContextSelector } from "use-context-selector";
import { useConversationCurrentTopic } from "./conversation-service";

type IConversationGroupContextType = {
  groupName: string | undefined;
  groupNameIsLoading: boolean;
  groupPhoto: string | undefined;
  groupPhotoIsLoading: boolean;
  // members: GroupMembersSelectData | undefined;
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

  const topic = useConversationCurrentTopic();
  const currentAccount = useCurrentAccount()!;

  const { data: groupName, isLoading: groupNameIsLoading } = useGroupNameQuery(
    currentAccount,
    topic!
  );

  const { data: groupPhoto, isLoading: groupPhotoIsLoading } =
    useGroupPhotoQuery(currentAccount, topic!);

  // const { data: members, isLoading: membersLoading } =
  //   useGroupMembersConversationScreenQuery(currentAccount, topic!);

  const value = useMemo(
    () => ({ groupName, groupNameIsLoading, groupPhoto, groupPhotoIsLoading }),
    [groupName, groupNameIsLoading, groupPhoto, groupPhotoIsLoading]
  );

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
) => {
  return useContextSelector(ConversationGroupContext, (s) => s[key]);
};

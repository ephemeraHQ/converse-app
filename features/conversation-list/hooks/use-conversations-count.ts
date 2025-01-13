import { queryClient } from "@/queries/queryClient";
import { conversationListQueryConfig } from "@/queries/useConversationListQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { QueryObserver } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const useConversationsCount = () => {
  const account = useCurrentAccount();

  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = new QueryObserver(queryClient, {
      ...conversationListQueryConfig({
        account: account!,
        context: "useConversationsCount",
      }),
    }).subscribe(({ data }) => {
      setCount(data?.length ?? 0);
    });

    return () => {
      unsubscribe();
    };
  }, [account]);

  return count;
};

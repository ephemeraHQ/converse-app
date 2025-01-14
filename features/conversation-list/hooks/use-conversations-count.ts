import { createConversationListQueryObserver } from "@/queries/useConversationListQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useEffect, useState } from "react";

export const useConversationsCount = () => {
  const account = useCurrentAccount();

  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = createConversationListQueryObserver({
      account: account!,
      context: "useConversationsCount",
    }).subscribe(({ data }) => {
      setCount(data?.length ?? 0);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [account]);

  return { count, isLoading };
};

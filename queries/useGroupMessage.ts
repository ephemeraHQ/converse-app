import { getGroupMessages } from "@queries/useGroupMessages";
import { useQuery } from "@tanstack/react-query";
import { groupMessageQueryKey } from "./QueryKeys"; // Assume you have a similar key generator
import { queryClient } from "./queryClient";

export type IGroupMessage = ReturnType<typeof fetchGroupMessage>;

function fetchGroupMessage(args: {
  account: string;
  topic: string;
  messageId: string;
}) {
  const messages = getGroupMessages(args.account, args.topic);
  return messages?.byId[args.messageId];
}

export const useGroupMessage = (args: {
  account: string;
  topic: string;
  messageId: string;
}) => {
  const { account, topic, messageId } = args;
  return useQuery({
    queryKey: groupMessageQueryKey(account, topic, messageId),
    queryFn: () => fetchGroupMessage(args),
  });
};

export const getGroupMessage = (
  account: string,
  topic: string,
  messageId: string
) => {
  return queryClient.getQueryData<IGroupMessage>(
    groupMessageQueryKey(account, topic, messageId)
  );
};

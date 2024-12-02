import { useQuery } from "@tanstack/react-query";
import { getPeerAddressFromTopic } from "@utils/xmtpRN/conversations";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { cacheOnlyQueryOptions } from "./cacheOnlyQueryOptions";

export const useDmPeerAddressQuery = (
  account: string,
  topic: ConversationTopic
) => {
  return useQuery({
    queryKey: ["dmPeerAddress", account, topic],
    queryFn: () => getPeerAddressFromTopic(account, topic),
    ...cacheOnlyQueryOptions,
  });
};

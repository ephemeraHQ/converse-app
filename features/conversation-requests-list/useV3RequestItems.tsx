import { getV3SpamScore } from "@data/helpers/conversations/spamScore";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useV3ConversationListQuery } from "@queries/useV3ConversationListQuery";
import { ConversationContainerWithCodecsType } from "@utils/xmtpRN/client";
import { useEffect, useState } from "react";

export const useV3RequestItems = () => {
  const currentAccount = useCurrentAccount();
  const { data, ...rest } = useV3ConversationListQuery(
    currentAccount!,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    "useV3RequestItems"
  );
  const [likelyNotSpam, setLikelyNotSpam] = useState<
    ConversationContainerWithCodecsType[]
  >([]);
  const [likelySpam, setLikelySpam] = useState<
    ConversationContainerWithCodecsType[]
  >([]);

  useEffect(() => {
    const fetchGroups = async () => {
      const likelyNotSpam: ConversationContainerWithCodecsType[] = [];
      const likelySpam: ConversationContainerWithCodecsType[] = [];
      await Promise.allSettled(
        (data ?? []).map(async (conversation) => {
          if (conversation.state !== "unknown") {
            return;
          }
          const lastMessage = conversation.lastMessage;
          let content = "";
          try {
            const decodedContent =
              lastMessage?.content() ?? lastMessage?.fallback ?? "";
            if (typeof decodedContent === "string") {
              content = decodedContent;
            } else {
              content = lastMessage?.fallback ?? "";
            }
          } catch {
            content = lastMessage?.fallback ?? "";
          }

          const spamScore = await getV3SpamScore({
            message: content,
            contentType: lastMessage?.contentTypeId ?? "",
          });
          if (spamScore > 1) {
            likelySpam.push(conversation);
          } else {
            likelyNotSpam.push(conversation);
          }
        })
      );
      setLikelyNotSpam(likelyNotSpam);
      setLikelySpam(likelySpam);
    };
    fetchGroups();
  }, [data]);

  return { likelyNotSpam, likelySpam, ...rest };
};

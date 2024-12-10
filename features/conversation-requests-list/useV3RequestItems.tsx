import logger from "@/utils/logger";
import { getMessageContentType } from "@/utils/xmtpRN/contentTypes";
import { getV3SpamScore } from "@data/helpers/conversations/spamScore";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useV3ConversationListQuery } from "@queries/useV3ConversationListQuery";
import { ConversationWithCodecsType } from "@utils/xmtpRN/client";
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
    ConversationWithCodecsType[]
  >([]);
  const [likelySpam, setLikelySpam] = useState<ConversationWithCodecsType[]>(
    []
  );

  useEffect(() => {
    const fetchGroups = async () => {
      const likelyNotSpam: ConversationWithCodecsType[] = [];
      const likelySpam: ConversationWithCodecsType[] = [];
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
          const contentType = getMessageContentType(
            lastMessage?.contentTypeId!
          );
          let spamScore = 0;
          try {
            if (contentType) {
              spamScore = await getV3SpamScore({
                message: content,
                contentType,
              });
            }
          } catch (error) {
            logger.error("Couldn't get spam score", error);
          }

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

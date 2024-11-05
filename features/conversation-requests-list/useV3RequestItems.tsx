import { getV3SpamScore } from "@data/helpers/conversations/spamScore";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupsConversationListQuery } from "@queries/useGroupsConversationListQuery";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { getMessageContentType } from "@utils/xmtpRN/contentTypes";
import { useEffect, useState } from "react";

export const useV3RequestItems = () => {
  const currentAccount = useCurrentAccount();
  const { data, ...rest } = useGroupsConversationListQuery(currentAccount!);
  const [likelyNotSpam, setLikelyNotSpam] = useState<GroupWithCodecsType[]>([]);
  const [likelySpam, setLikelySpam] = useState<GroupWithCodecsType[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      for (const group of data ?? []) {
        if (group.state !== "unknown") {
          continue;
        }
        const lastMessage = group.lastMessage;
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
          contentType:
            getMessageContentType(lastMessage?.contentTypeId ?? "") ?? "",
          adderInboxId: group.addedByInboxId,
        });

        if (spamScore > 1) {
          setLikelySpam((prev) => [...prev, group]);
        } else {
          setLikelyNotSpam((prev) => [...prev, group]);
        }
      }
    };
    fetchGroups();
  }, [data]);

  return { likelyNotSpam, likelySpam, ...rest };
};

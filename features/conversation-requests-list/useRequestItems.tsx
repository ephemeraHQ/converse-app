import { useMemo } from "react";
import { useV2RequestItems } from "./useV2RequestItems";
import { useV3RequestItems } from "./useV3RequestItems";
import { mergeOrderedLists } from "@utils/mergeLists";

export const useRequestItems = () => {
  const { likelyNotSpam: likelyNotSpamV2, likelySpam: likelySpamV2 } =
    useV2RequestItems();
  const { likelyNotSpam: likelyNotSpamV3, likelySpam: likelySpamV3 } =
    useV3RequestItems();

  return useMemo(() => {
    const likelyNotSpam = mergeOrderedLists(
      likelyNotSpamV2,
      likelyNotSpamV3,
      (a) => a.lastMessagePreview?.message?.sent ?? 0,
      (b) => b.lastMessage?.sent ?? 0
    );
    const likelySpam = mergeOrderedLists(
      likelySpamV2,
      likelySpamV3,
      (a) => a.lastMessagePreview?.message?.sent ?? 0,
      (b) => b.lastMessage?.sent ?? 0
    );
    return { likelyNotSpam, likelySpam };
  }, [likelyNotSpamV2, likelyNotSpamV3, likelySpamV2, likelySpamV3]);
};

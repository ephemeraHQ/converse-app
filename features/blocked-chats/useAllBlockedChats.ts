import { useMemo } from "react";
import { useV2BlockedChats } from "./useV2BlockedChats";
import { useV3BlockedChats } from "./useV3BlockedChats";

export const useAllBlockedChats = () => {
  const { data: v3BlockedChats } = useV3BlockedChats();
  const v2BlockedChats = useV2BlockedChats();
  return useMemo(
    () => [...(v3BlockedChats ?? []), ...v2BlockedChats],
    [v3BlockedChats, v2BlockedChats]
  );
};

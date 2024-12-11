import { useDebugEnabled } from "@components/DebugButton";
import Clipboard from "@react-native-clipboard/clipboard";
import { useCallback } from "react";

export const useConversationTitleLongPress = (topic: string) => {
  const debugEnabled = useDebugEnabled();

  return useCallback(() => {
    if (!debugEnabled) return;
    Clipboard.setString(
      JSON.stringify({
        topic,
      })
    );
  }, [debugEnabled, topic]);
};

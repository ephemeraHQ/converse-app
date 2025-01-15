import { VStack } from "@/design-system/VStack";
import { EmptyState } from "@/design-system/empty-state";
import { useBlockedChatsForCurrentAccount } from "@/features/blocked-chats/use-blocked-chats";
import { ConversationList } from "@/features/conversation-list/conversation-list";
import { useHeader } from "@/navigation/use-header";
import { useRouter } from "@/navigation/useNavigation";
import { $globalStyles } from "@/theme/styles";
import { translate } from "@i18n/index";
import React from "react";

export function BlockedChatsScreen() {
  const { data: allBlockedChats = [] } = useBlockedChatsForCurrentAccount();

  const router = useRouter();

  useHeader({
    safeAreaEdges: ["top"],
    onBack: () => router.goBack(),
    titleTx: "removed_chats.removed_chats",
  });

  return (
    <VStack style={$globalStyles.flex1}>
      {allBlockedChats.length > 0 ? (
        <ConversationList conversations={allBlockedChats} />
      ) : (
        <EmptyState
          title={translate("removed_chats.eyes")}
          description={translate("removed_chats.no_removed_chats")}
        />
      )}
    </VStack>
  );
}

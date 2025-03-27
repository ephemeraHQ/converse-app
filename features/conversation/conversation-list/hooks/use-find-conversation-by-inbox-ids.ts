// import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
// import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
// import { getAllowedConsentConversationsQueryOptions } from "@/queries/conversations-allowed-consent-query";
// import { getDmPeerInboxIdQueryOptions } from "@/queries/use-dm-peer-inbox-id-query";
// import { getGroupMembersQueryOptions } from "@/queries/useGroupMembersQuery";
// import { isSameInboxId } from "@/utils/xmtpRN/xmtp-inbox-id/xmtp-inbox-id";
// import { useCurrentAccount } from "@data/store/accountsStore";
// import { useQueries, useQuery } from "@tanstack/react-query";
// import { IXmtpInboxId } from "@features/xmtp/xmtp.types";
// import { useMemo } from "react";

// export const useFindConversationByInboxIds = (args: {
//   inboxIds: IXmtpInboxId[];
// }) => {
//   const { inboxIds } = args;

//   const account = useCurrentAccount();

//   const { data: conversations, isLoading: isLoadingConversations } = useQuery(
//     getAllowedConsentConversationsQueryOptions({
//       account: account!,
//       caller: "useFindConversationByMembers",
//     })
//   );

//   const groups = useMemo(
//     () => conversations?.filter(isConversationGroup) || [],
//     [conversations]
//   );

//   const dms = useMemo(
//     () => conversations?.filter(isConversationDm) || [],
//     [conversations]
//   );

//   const groupMembersQueries = useQueries({
//     queries:
//       groups.map((conversation) => ({
//         ...getGroupMembersQueryOptions({
//           account: account!,
//           topic: conversation.topic,
//         }),
//       })) || [],
//   });

//   const dmPeerInboxIdQueries = useQueries({
//     queries:
//       dms.map((dm) => ({
//         ...getDmPeerInboxIdQueryOptions({
//           account: account!,
//           topic: dm.topic,
//           caller: "useFindConversationByMembers",
//         }),
//       })) || [],
//   });

//   const existingConversation = useMemo(() => {
//     if (!conversations || inboxIds.length === 0) {
//       return undefined;
//     }

//     // Check groups first since the logic is the same for both cases
//     const matchingGroup = groups.find((group, index) => {
//       const groupMembersQuery = groupMembersQueries[index];
//       const memberIds = groupMembersQuery.data?.ids;
//       if (!memberIds) return false;
//       return memberIds.every((memberId) =>
//         inboxIds.some((inboxId) => isSameInboxId(memberId, inboxId))
//       );
//     });

//     // If we found a group or if we're looking for multiple members, return the result
//     if (matchingGroup || inboxIds.length > 1) {
//       return matchingGroup;
//     }

//     // Only check DMs for single inboxId
//     return dms.find((dm, index) => {
//       const peerInboxIdQuery = dmPeerInboxIdQueries[index];
//       const peerInboxId = peerInboxIdQuery.data;
//       return peerInboxId && isSameInboxId(inboxIds[0], peerInboxId);
//     });
//   }, [
//     conversations,
//     groups,
//     dms,
//     groupMembersQueries,
//     dmPeerInboxIdQueries,
//     inboxIds,
//   ]);

//   const isLoading =
//     isLoadingConversations ||
//     groupMembersQueries.some((query) => query.isLoading) ||
//     dmPeerInboxIdQueries.some((query) => query.isLoading);

//   return { conversation: existingConversation, isLoading };
// };

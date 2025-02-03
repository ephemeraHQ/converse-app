// import { VStack } from "@/design-system/VStack";
// import { useSendMessage } from "@/features/conversation/hooks/use-send-message";
// import { CreateConversationComposerSection } from "@/features/create-conversation/components/composer-section";
// import { MessageSection } from "@/features/create-conversation/components/message-section";
// import { UserInlineSearch } from "@/features/create-conversation/components/user-inline-search";
// import { ConversationSearchResultsList } from "@/features/search/components/conversation-search-results-list";
// import { useSearchUsersQuery } from "@/features/search/search-convos-users/search-convos-users.query";
// import { useHeader } from "@/navigation/use-header";
// import { useRouter } from "@/navigation/useNavigation";
// import { $globalStyles } from "@/theme/styles";
// import { useAppTheme } from "@/theme/useAppTheme";
// import { debugBorder } from "@/utils/debug-style";
// import { getPreferredAvatar, getPreferredName } from "@/utils/profile";
// import { getCurrentAccount } from "@data/store/accountsStore";
// import {
//   Conversation,
//   ConversationTopic,
//   ConversationVersion,
// } from "@xmtp/react-native-sdk";
// import React, { useCallback, useEffect, useState } from "react";
// import { View } from "react-native";
// import { useSharedValue } from "react-native-reanimated";
// import { useFindConversationByMembers } from "../conversation-list/hooks/use-conversations-count";
// import { IProfileSocials } from "../profiles/profile-types";
// import { useOptimisticSendFirstMessage } from "../search/use-optimistic-send-first-message.hook";
// import { createConversationStyles } from "./create-conversation.styles";

// /**
//  * Screen for creating new conversations
//  * Supports creating both DMs and group chats
//  */
// export function CreateConversationScreen(props: {
//   onSelectTopic: (topic: ConversationTopic) => void;
// }) {
//   const navigation = useRouter();
//   const { themed } = useAppTheme();
//   const [conversationMode, setConversationMode] = useState<ConversationVersion>(
//     ConversationVersion.DM
//   );
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedUsers, setSelectedUsers] = useState<
//     Array<{
//       address: string;
//       name: string;
//       socials: IProfileSocials;
//     }>
//   >([]);
//   const {
//     conversations: existingConversations,
//     isLoading: isLoadingExistingConversation,
//   } = useFindConversationByMembers(selectedUsers.map((u) => u.address));

//   const existingDm = existingConversations?.find(
//     (c) => c.version === ConversationVersion.DM
//   );

//   const existingGroup = existingConversations?.find(
//     (c) => c.version === ConversationVersion.GROUP
//   );

//   const [existingConversation, setExistingConversation] =
//     useState<Conversation | null>(existingDm || existingGroup || null);
//   useEffect(() => {
//     setExistingConversation(existingDm || existingGroup || null);
//   }, [existingDm, existingGroup]);

//   const { sendMessage, error: messageSendError } = useSendMessage();
//   const selectedAddresses = selectedUsers.map((u) => u.address);
//   const { sendMessage: sendMessageOptimistic, tempTopic } =
//     useOptimisticSendFirstMessage({ members: selectedAddresses });

//   const currentUserAddress = getCurrentAccount() || "";

//   const { searchResults, areSearchResultsLoading, hasSearchResults } =
//     useSearchUsersQuery({
//       searchQuery,
//       addressesToOmit: [...selectedAddresses, currentUserAddress],
//     });

//   const selectedUsersCount = selectedUsers.length;
//   const composerDisabled = selectedUsersCount === 0;

//   const handleBack = useCallback(() => {
//     navigation.goBack();
//   }, [navigation]);

//   useEffect(() => {
//     if (selectedUsersCount > 1) {
//       setConversationMode(ConversationVersion.GROUP);
//     } else if (selectedUsersCount === 1) {
//       setConversationMode(ConversationVersion.DM);
//     }
//   }, [selectedUsersCount]);

//   const { theme } = useAppTheme();

//   useHeader({
//     title: "New chat",
//     safeAreaEdges: ["top"],
//     onBack: handleBack,
//     style: {
//       borderBottomWidth: theme.borderWidth.sm,
//       borderBottomColor: theme.colors.border.subtle,
//     },
//   });

//   const handleSendMessage = async (content: { text: string }) => {
//     const messageText = content.text;
//     if (!messageText) return;

//     if (conversationMode === ConversationVersion.DM) {
//       // you should only have one dm with another user
//       // other clients could break this assumption - we should handle then
//       const existingDm = existingConversations?.find(
//         (c) => c.version === ConversationVersion.DM
//       );

//       if (existingDm) {
//         sendMessage({
//           topic: existingDm.topic,
//           content: { text: messageText },
//         });
//         navigation.replace("Conversation", { topic: existingDm.topic });
//         return;
//       } else {
//         // alert("todo: create dm conversation and dm message");
//         sendMessageOptimistic({
//           content: { text: messageText },
//         });
//         navigation.replace("Conversation", {
//           topic: tempTopic! as ConversationTopic,
//           optimistic: true,
//         });
//       }
//     } else {
//       if (existingGroup) {
//         sendMessage({
//           topic: existingGroup.topic,
//           content: { text: messageText },
//         });
//         navigation.replace("Conversation", { topic: existingGroup.topic });
//         return;
//       } else {
//         sendMessageOptimistic({
//           content: { text: messageText },
//         });
//         navigation.replace("Conversation", {
//           topic: tempTopic! as ConversationTopic,
//           optimistic: true,
//         });
//       }
//     }
//   };

//   const handleSearchResultPress = useCallback(
//     ({ address, socials }: { address: string; socials: IProfileSocials }) => {
//       setSelectedUsers((prev) => [
//         ...prev,
//         {
//           address,
//           name: getPreferredName(socials, address),
//           socials,
//         },
//       ]);
//       setSearchQuery("");
//     },
//     []
//   );

//   const handleGroupPress = (topic: string) => {
//     navigation.navigate("Conversation", { topic: topic as ConversationTopic });
//     // navigation.navigate("Conversation", { topic: topic as ConversationTopic });
//   };

//   const showingSearchResultsAV = useSharedValue(0);

//   return (
//     <View style={themed(createConversationStyles.$screenContainer)}>
//       <UserInlineSearch
//         defaultValue={searchQuery}
//         onChangeText={setSearchQuery}
//         placeholder="Name, address or onchain ID"
//         selectedUsers={selectedUsers.map((u) => ({
//           address: u.address,
//           name: u.name,
//           avatarUri: getPreferredAvatar(u.socials),
//         }))}
//         onRemoveUser={(address: string) => {
//           setSelectedUsers((prev) => prev.filter((u) => u.address !== address));
//         }}
//       />

//       <VStack
//         {...debugBorder("red")}
//         style={{
//           flex: 1,
//         }}
//       >
//         <VStack
//           {...debugBorder("yellow")}
//           style={[
//             $globalStyles.absoluteFill,
//             {
//               backgroundColor: theme.colors.background.surface,
//               zIndex: 1,
//             },
//           ]}
//         >
//           <ConversationSearchResultsList
//             searchResults={searchResults}
//             handleSearchResultItemPress={handleSearchResultPress}
//             handleGroupPress={handleGroupPress}
//           />
//         </VStack>

//         {/* {message && <MessageSection message={message} />} */}

//         <VStack
//           {...debugBorder()}
//           style={{
//             flex: 1,
//           }}
//         >
//           {/* {messageSendError && (
//             <MessageSection message={messageSendError.message} />
//           )}

//           {areSearchResultsLoading && (
//             <View style={$globalStyles.flex1}>
//               <Loader size="large" />
//             </View>
//           )}

//           {existingConversation && (
//             <MessageSection
//               message={`${existingConversation.topic} already exists with name ${
//                 // @ts-ignore
//                 existingConversation.name || "dm"
//               }`}
//               isError={false}
//             />
//           )} */}

//           {/* <ConversationMessagesList messages={[]} renderMessage={() => null} /> */}

//           {existingConversations && (
//             <MessageSection
//               message={`${
//                 existingConversations.length
//               } conversations already exist with ${selectedUsers
//                 .map((u) => u.name)
//                 .join(", ")}`}
//               isError={false}
//             />
//           )}

//           {!existingConversations && !isLoadingExistingConversation && (
//             <MessageSection
//               message={"Conversation does not exist with those members"}
//               isError={false}
//             />
//           )}

//           <CreateConversationComposerSection
//             disabled={composerDisabled}
//             conversationMode={conversationMode}
//             onSend={handleSendMessage}
//           />
//         </VStack>
//       </VStack>
//     </View>
//   );
// }

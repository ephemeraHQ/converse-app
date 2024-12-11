// /**
//  * TODO
//  */

// import { Text } from "@/design-system/Text";
// import { VStack } from "@/design-system/VStack";
// import { Loader } from "@/design-system/loader";
// import { TouchableWithoutFeedback } from "@/design-system/touchable-without-feedback";
// import { useCurrentConversationTopic } from "@/features/conversation/conversation.service";
// import { Recommendation } from "@components/Recommendations/Recommendation";
// import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
// import { currentAccount, useProfilesStore } from "@data/store/accountsStore";
// import { Button } from "@design-system/Button/Button";
// import { translate } from "@i18n";
// import { actionSheetColors, textPrimaryColor } from "@styles/colors";
// import { isV3Topic } from "@utils/groupUtils/groupId";
// import { getProfile, getProfileData } from "@utils/profile";
// import { DmWithCodecsType } from "@utils/xmtpRN/client";
// import { consentToAddressesOnProtocolByAccount } from "@utils/xmtpRN/contacts";
// import { Keyboard, Platform, useColorScheme } from "react-native";

// type IProps = {
//   messagesCount: number;
//   conversation: DmWithCodecsType | undefined | null;
//   isBlockedPeer: boolean;
//   recommendationData: any; // TODO: Add proper type
//   conversationName: (conversation: DmWithCodecsType) => string;
//   sendMessage: (args: {
//     conversation: DmWithCodecsType;
//     content: string;
//     contentType: string;
//   }) => void;
// };

// export function DmChatPlaceholder(args: IProps) {
//   const {
//     messagesCount,
//     conversation,
//     isBlockedPeer,
//     recommendationData,
//     conversationName,
//     sendMessage,
//   } = args;

//   const topic = useCurrentConversationTopic();
//   const colorScheme = useColorScheme();

//   //   const { peerAddress } = useInboxProfileSocials(conversation);

//   const peerSocials = useProfilesStore((s) =>
//     conversation?.peerAddress
//       ? getProfile(conversation.peerAddress, s.profiles)?.socials
//       : undefined
//   );
//   const profileData = getProfileData(recommendationData, peerSocials);

//   return (
//     <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//       <VStack
//         style={{
//           flex: 1,
//           justifyContent: "center",
//         }}
//       >
//         {!conversation && (
//           <VStack>
//             {!topic && <Loader />}
//             <Text
//               style={{
//                 textAlign: "center",
//                 fontSize: Platform.OS === "android" ? 16 : 17,
//                 color: textPrimaryColor(colorScheme),
//                 paddingHorizontal: 30,
//               }}
//             >
//               {topic
//                 ? isV3Topic(topic)
//                   ? translate("group_not_found")
//                   : translate("conversation_not_found")
//                 : translate("opening_conversation")}
//             </Text>
//           </VStack>
//         )}

//         {conversation && isBlockedPeer && (
//           <VStack>
//             <Text
//               style={{
//                 textAlign: "center",
//                 fontSize: Platform.OS === "android" ? 16 : 17,
//                 color: textPrimaryColor(colorScheme),
//                 paddingHorizontal: 30,
//               }}
//             >
//               This user is blocked
//             </Text>
//             <Button
//               variant="fill"
//               picto="lock.open"
//               text="Unblock"
//               style={{
//                 alignSelf: "center",
//                 marginTop: 20,
//               }}
//               onPress={() => {
//                 showActionSheetWithOptions(
//                   {
//                     options: ["Unblock", "Cancel"],
//                     cancelButtonIndex: 1,
//                     destructiveButtonIndex: isBlockedPeer ? undefined : 0,
//                     title: translate("if_you_unblock_contact"),
//                     ...actionSheetColors(colorScheme),
//                   },
//                   (selectedIndex?: number) => {
//                     if (selectedIndex === 0 && conversation?.peerAddress) {
//                       const { peerAddress } = conversation;
//                       consentToAddressesOnProtocolByAccount({
//                         account: currentAccount(),
//                         addresses: [peerAddress],
//                         consent: "allow",
//                       });
//                     }
//                   }
//                 );
//               }}
//             />
//           </VStack>
//         )}

//         {conversation && !isBlockedPeer && messagesCount === 0 && (
//           <VStack>
//             {profileData && !conversation.isGroup ? (
//               <Recommendation
//                 address={conversation.peerAddress}
//                 recommendationData={profileData}
//                 embedInChat
//                 isVisible
//               />
//             ) : (
//               <Text
//                 style={{
//                   textAlign: "center",
//                   fontSize: Platform.OS === "android" ? 16 : 17,
//                   color: textPrimaryColor(colorScheme),
//                   paddingHorizontal: 30,
//                 }}
//               >
//                 This is the beginning of your{"\n"}conversation with{" "}
//                 {conversation ? conversationName(conversation) : ""}
//               </Text>
//             )}

//             <Button
//               variant="fill"
//               picto="hand.wave"
//               text="Say hi"
//               style={{
//                 alignSelf: "center",
//                 marginTop: 20,
//               }}
//               onPress={() => {
//                 sendMessage({
//                   conversation,
//                   content: "👋",
//                   contentType: "xmtp.org/text:1.0",
//                 });
//               }}
//             />
//           </VStack>
//         )}
//       </VStack>
//     </TouchableWithoutFeedback>
//   );
// }

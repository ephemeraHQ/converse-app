// import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
// import { getCurrentAccount } from "@/data/store/accountsStore";
// import { Button } from "@/design-system/Button/Button";
// import { Center } from "@/design-system/Center";
// import { Text } from "@/design-system/Text";
// import { TouchableWithoutFeedback } from "@/design-system/touchable-without-feedback";
// import { ConversationComposer } from "@/features/conversation/conversation-composer/conversation-composer";
// import { ConversationComposerContainer } from "@/features/conversation/conversation-composer/conversation-composer-container";
// import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-composer/conversation-composer.store-context";
// import { ConversationKeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";
// import { NewConversationTitle } from "@/features/conversation/conversation-screen-header/conversation-screen-new-dm-header-title";
// import { sendMessage } from "@/features/conversation/hooks/use-send-message";
// import { usePreferredName } from "@/hooks/usePreferredName";
// import { translate } from "@/i18n";
// import { useHeader } from "@/navigation/use-header";
// import { useRouter } from "@/navigation/useNavigation";
// import { addConversationToAllowedConsentConversationsQuery } from "@/queries/conversations-allowed-consent-query";
// import { setDmQueryData } from "@/queries/useDmQuery";
// import { useAppTheme } from "@/theme/useAppTheme";
// import { captureError } from "@/utils/capture-error";
// import { sentryTrackError } from "@/utils/sentry";
// import { createConversationByAccount } from "@/utils/xmtpRN/conversations";
// import { useMutation } from "@tanstack/react-query";
// import { ConversationTopic } from "@xmtp/react-native-sdk";
// import { memo, useCallback } from "react";
// import { Keyboard } from "react-native";

// export const ConversationNew = memo(function ConversationNew(props: {
//   textPrefill?: string;
// }) {
//   const { textPrefill } = props;

//   const { theme } = useAppTheme();

//   const navigation = useRouter();

//   useHeader({
//     title: "New chat",
//     safeAreaEdges: ["top"],
//     onBack: () => navigation.goBack(),
//     style: {
//       borderBottomWidth: theme.borderWidth.sm,
//       borderBottomColor: theme.colors.border.subtle,
//     },
//   });

//   // const sendFirstConversationMessage =
//   //   useSendFirstConversationMessage(peerAddress);

//   // const handleSendWelcomeMessage = useCallback(() => {
//   //   sendFirstConversationMessage({
//   //     content: { text: "👋" },
//   //   });
//   // }, [sendFirstConversationMessage]);

//   return (
//     <ConversationComposerStoreProvider
//       storeName={"new-conversation" as ConversationTopic}
//       inputValue={textPrefill}
//     >
//       <ConversationNewDmNoMessagesPlaceholder
//         peerAddress={peerAddress}
//         isBlockedPeer={false} // TODO
//         onSendWelcomeMessage={handleSendWelcomeMessage}
//       />
//       <ConversationComposerContainer>
//         <ConversationComposer onSend={sendFirstConversationMessage} />
//       </ConversationComposerContainer>
//       <ConversationKeyboardFiller
//         messageContextMenuIsOpen={false}
//         enabled={true}
//       />
//     </ConversationComposerStoreProvider>
//   );
// });

// type IConversationNewDmNoMessagesPlaceholderProps = {
//   peerAddress: string;
//   onSendWelcomeMessage: () => void;
//   isBlockedPeer: boolean;
// };

// function ConversationNewDmNoMessagesPlaceholder(
//   args: IConversationNewDmNoMessagesPlaceholderProps
// ) {
//   const { peerAddress, onSendWelcomeMessage, isBlockedPeer } = args;

//   const { theme } = useAppTheme();

//   const peerPreferredName = usePreferredName(peerAddress);

//   if (isBlockedPeer) {
//     // TODO
//     return null;
//   }

//   return (
//     <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//       <Center
//         style={{
//           flex: 1,
//           flexDirection: "column",
//           paddingHorizontal: theme.spacing.md,
//           rowGap: theme.spacing.sm,
//         }}
//       >
//         <Text
//           style={{
//             textAlign: "center",
//           }}
//         >
//           {translate("this_is_the_beginning_of_your_conversation_with", {
//             name: peerPreferredName,
//           })}
//         </Text>
//         <Button
//           variant="fill"
//           icon="hand.wave"
//           tx="say_hi"
//           onPress={onSendWelcomeMessage}
//         />
//       </Center>
//     </TouchableWithoutFeedback>
//   );
// }

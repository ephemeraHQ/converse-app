/**
 *
 * KEEP UNTIL WE FINALIZE THE REQUESTS LIST DESIGN
 *
 */

// import { ConversationList } from "@/features/conversation-list/conversation-list";
// import { RequestsSegmentedController } from "@/features/conversation-requests-list/RequestsSegmentedController";
// import { translate } from "@i18n";
// import { RouteProp } from "@react-navigation/native";
// import { NativeStackNavigationProp } from "@react-navigation/native-stack";
// import {
//   actionSheetColors,
//   backgroundColor,
//   textPrimaryColor,
//   textSecondaryColor,
// } from "@styles/colors";
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { StyleSheet, Text, View, useColorScheme } from "react-native";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { StackAnimationTypes } from "react-native-screens";
// import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
// import Button from "../../components/Button/Button";
// import { showActionSheetWithOptions } from "../../components/StateHandlers/ActionSheetStateHandler";
// import { useCurrentAccount } from "../../data/store/accountsStore";
// import { useRequestItems } from "./useRequestItems";
// import { consentToAddressesOnProtocolByAccount } from "../../utils/xmtpRN/contacts";
// import {
//   NativeStack,
//   NavigationParamList,
//   navigationAnimation,
// } from "../../screens/Navigation/Navigation";

// export default function ConversationRequestsListNav() {
//   const colorScheme = useColorScheme();
//   const account = useCurrentAccount() as string;
//   const navRef = useRef<any>();
//   const [clearingAll, setClearingAll] = useState(false);

//   const [selectedSegment, setSelectedSegment] = useState(0);
//   const { likelySpam, likelyNotSpam } = useRequestItems();

//   const clearAllSpam = useCallback(() => {
//     const options = {
//       clearAll: translate("clear_all"),
//       cancel: translate("cancel"),
//     };

//     const methods = {
//       [options.clearAll]: async () => {
//         setClearingAll(true);
//         const peers = Array.from(
//           new Set(
//             likelyNotSpam.map((c) =>
//               "addedByInboxId" in c ? c.addedByInboxId : undefined
//             )
//           )
//         ).filter((peer) => !!peer) as string[];
//         await consentToAddressesOnProtocolByAccount({
//           account,
//           addresses: peers,
//           consent: "deny",
//         });
//         setClearingAll(false);
//         navRef.current?.goBack();
//       },
//       [options.cancel]: () => {},
//     };

//     const optionKeys = [options.clearAll, options.cancel];

//     showActionSheetWithOptions(
//       {
//         options: optionKeys,
//         destructiveButtonIndex: optionKeys.indexOf(options.clearAll),
//         cancelButtonIndex: optionKeys.indexOf(options.cancel),
//         title: translate("clear_confirm"),
//         ...actionSheetColors(colorScheme),
//       },
//       (selectedIndex?: number) => {
//         if (selectedIndex === undefined) return;
//         const method = (methods as any)[optionKeys[selectedIndex]];
//         if (method) {
//           method();
//         }
//       }
//     );
//   }, [account, colorScheme, likelyNotSpam]);

//   const navigationOptions = useCallback(
//     ({
//       route,
//       navigation,
//     }: {
//       route: RouteProp<NavigationParamList, "ChatsRequests">;
//       navigation: NativeStackNavigationProp<
//         NavigationParamList,
//         "ChatsRequests"
//       >;
//     }) => ({
//       animation: navigationAnimation as StackAnimationTypes,
//       headerTitle: clearingAll
//         ? () => (
//             <View
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 width: 110,
//               }}
//             >
//               <ActivityIndicator />
//               <Text
//                 style={{ marginLeft: 10, color: textPrimaryColor(colorScheme) }}
//               >
//                 {translate("clearing")}
//               </Text>
//             </View>
//           )
//         : translate("message_requests"),
//       headerLeft: undefined,
//       headerRight: () =>
//         clearingAll ? undefined : (
//           <Button
//             variant="text"
//             title={translate("clear_all")}
//             onPress={clearAllSpam}
//           />
//         ),
//     }),
//     [clearAllSpam, clearingAll, colorScheme]
//   );

//   useEffect(() => {
//     const unsubscribe = navRef.current?.addListener("focus", () => {
//       if (likelyNotSpam.length === 0 && likelySpam.length === 0) {
//         navRef.current?.goBack();
//       }
//     });
//     return unsubscribe;
//   }, [likelyNotSpam.length, likelySpam.length]);

//   const hasLikelyNotSpam = likelyNotSpam.length > 0;

//   const handleSegmentChange = (index: number) => {
//     setSelectedSegment(index);
//   };

//   const renderSegmentedController = () => {
//     return (
//       <RequestsSegmentedController
//         options={[translate("you_might_know"), translate("hidden_requests")]}
//         selectedIndex={selectedSegment}
//         onSelect={handleSegmentChange}
//       />
//     );
//   };

//   const renderContent = () => {
//     const showSuggestionText = selectedSegment === 0 && hasLikelyNotSpam;
//     const showNoSuggestionsText = selectedSegment === 0 && !hasLikelyNotSpam;
//     const showSpamWarning = selectedSegment === 1;
//     const itemsToShow = selectedSegment === 0 ? likelyNotSpam : likelySpam;

//     return (
//       <>
//         {renderSegmentedController()}
//         {showSuggestionText && (
//           <Text
//             style={{
//               fontSize: 12,
//               color: textSecondaryColor(colorScheme),
//               textAlign: "center",
//               paddingHorizontal: 16,
//               marginTop: 14,
//               marginBottom: 12,
//               marginHorizontal: 16,
//             }}
//           >
//             {translate("suggestion_text")}
//           </Text>
//         )}
//         {showNoSuggestionsText && (
//           <Text
//             style={{
//               fontSize: 12,
//               color: textSecondaryColor(colorScheme),
//               textAlign: "center",
//               paddingHorizontal: 16,
//               marginTop: 14,
//               marginBottom: 12,
//               marginHorizontal: 16,
//             }}
//           >
//             {translate("no_suggestions_text")}
//           </Text>
//         )}
//         {showSpamWarning && (
//           <Text
//             style={{
//               fontSize: 12,
//               color: textSecondaryColor(colorScheme),
//               textAlign: "center",
//               paddingHorizontal: 16,
//               marginTop: 14,
//               marginBottom: 12,
//               marginHorizontal: 16,
//             }}
//           >
//             {translate("hidden_requests_warn")}
//           </Text>
//         )}
//       </>
//     );
//   };
// }

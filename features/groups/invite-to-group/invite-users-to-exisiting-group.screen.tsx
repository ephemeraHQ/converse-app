// import { Button } from "@design-system/Button/Button";
// import { NativeStackScreenProps } from "@react-navigation/native-stack";
// import {
//   backgroundColor,
//   itemSeparatorColor,
//   primaryColor,
//   textPrimaryColor,
//   textSecondaryColor,
// } from "@styles/colors";
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import {
//   Alert,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
//   useColorScheme,
// } from "react-native";

// import AndroidBackAction from "@/components/AndroidBackAction";
// import { SearchBar } from "@/components/SearchBar";
// import TableView from "@/components/TableView/TableView";
// import { TableViewPicto } from "@/components/TableView/TableViewImage";

// import { ActivityIndicator } from "@/design-system/activity-indicator";
// import { useGroupMembers } from "@/hooks/useGroupMembers";
// import { translate } from "@/i18n";
// import { NavigationParamList } from "@/screens/Navigation/Navigation";
// import { isEmptyObject } from "@/utils/objects";
// import {
//   ISearchProfilesResult,
//   searchProfiles,
// } from "@/features/profiles/profiles.api";
// import { getProfileQueryData } from "@/features/profiles/profiles.query";
// export function InviteUsersToExistingGroupScreen({
//   route,
//   navigation,
// }: NativeStackScreenProps<NavigationParamList, "InviteUsersToExistingGroup">) {
//   const colorScheme = useColorScheme();
//   const [group, setGroup] = useState({
//     enabled: !!route.params?.addingToGroupTopic,
//     members: [] as (ISearchProfilesResult & { address: string })[],
//   });

//   const { addMembers, members } = useGroupMembers(
//     route.params?.addingToGroupTopic!
//   );

//   const [loading, setLoading] = useState(false);

//   const handleBack = useCallback(() => navigation.goBack(), [navigation]);

//   const styles = useStyles();

//   const handleRightAction = useCallback(async () => {
//     setLoading(true);
//     try {
//       //  TODO: Support multiple addresses
//       await addMembers(group.members.map((m) => m.address));
//       navigation.goBack();
//     } catch (e) {
//       setLoading(false);
//       console.error(e);
//       Alert.alert("An error occured");
//     }
//   }, [addMembers, group.members, navigation]);

//   useEffect(() => {
//     navigation.setOptions({
//       headerLeft: () =>
//         Platform.OS === "ios" ? (
//           <Button
//             variant="text"
//             text={translate("Cancel")}
//             onPress={handleBack}
//           />
//         ) : (
//           <AndroidBackAction navigation={navigation} />
//         ),
//       headerTitle: translate("invite_to_group.add_members"),
//       headerRight: () => {
//         if (group.enabled && group.members.length > 0) {
//           if (loading) {
//             return <ActivityIndicator style={styles.activityIndicator} />;
//           } else {
//             return (
//               <Button
//                 variant="text"
//                 text={route.params?.addingToGroupTopic ? "Add" : "Next"}
//                 onPress={handleRightAction}
//                 style={{ marginRight: -10, padding: 10 }}
//               />
//             );
//           }
//         }
//         return undefined;
//       },
//     });
//   }, [
//     group,
//     loading,
//     navigation,
//     route.params?.addingToGroupTopic,
//     addMembers,
//     handleBack,
//     handleRightAction,
//     styles.activityIndicator,
//     colorScheme,
//   ]);

//   const [value, setValue] = useState("");
//   const searchingForValue = useRef("");
//   const [status, setStatus] = useState({
//     loading: false,
//     error: "",
//     inviteToConverse: "",
//     profileSearchResults: {} as { [address: string]: ISearchProfilesResult },
//   });

//   const debounceDelay = 500;
//   const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   useEffect(() => {
//     if (value.length < 3) {
//       // If the input is less than 3 characters, do nothing
//       setStatus({
//         loading: false,
//         error: "",
//         inviteToConverse: "",
//         profileSearchResults: {},
//       });
//       return;
//     }

//     if (debounceTimer.current !== null) {
//       clearTimeout(debounceTimer.current);
//     }

//     debounceTimer.current = setTimeout(async () => {
//       const searchForValue = async () => {
//         setStatus(({ loading }) => ({
//           loading,
//           error: "",
//           inviteToConverse: "",
//           profileSearchResults: {},
//         }));

//         setStatus({
//           loading: true,
//           error: "",
//           inviteToConverse: "",
//           profileSearchResults: {},
//         });

//         const profiles = await searchProfiles({
//           searchQuery: value,
//         });

//         if (!isEmptyObject(profiles)) {
//           // Let's save the profiles for future use
//           setStatus({
//             loading: false,
//             error: "",
//             inviteToConverse: "",
//             profileSearchResults: profiles.reduce((acc, profile) => {
//               acc[profile.xmtpId] = profile;
//               return acc;
//             }, {} as { [address: string]: ISearchProfilesResult }),
//           });
//         } else {
//           setStatus({
//             loading: false,
//             error: "",
//             inviteToConverse: "",
//             profileSearchResults: {},
//           });
//         }
//         // }
//       };
//       searchForValue();
//     }, debounceDelay);

//     return () => {
//       if (debounceTimer.current !== null) {
//         clearTimeout(debounceTimer.current);
//       }
//     };
//   }, [value]);

//   const inputRef = useRef<TextInput | null>(null);
//   const initialFocus = useRef(false);

//   const inputPlaceholder = ".converse.xyz, 0x, .eth, .lens, .fc, .cb.id, UD…";

//   const onRef = useCallback(
//     (r: TextInput | null) => {
//       if (!initialFocus.current) {
//         initialFocus.current = true;
//         if (!value) {
//           setTimeout(() => {
//             r?.focus();
//           }, 100);
//         }
//       }
//       inputRef.current = r;
//     },
//     [value]
//   );

//   return (
//     <View style={styles.searchContainer}>
//       <SearchBar
//         value={value}
//         setValue={setValue}
//         onRef={onRef}
//         inputPlaceholder={inputPlaceholder}
//       />
//       <View
//         style={[
//           styles.group,
//           {
//             display:
//               group.enabled && group.members.length === 0 ? "none" : "flex",
//           },
//         ]}
//       >
//         {!group.enabled && (
//           <Button
//             variant="text"
//             picto="person.2"
//             text={translate("new_group.title")}
//             style={styles.newGroupButton}
//             onPress={() => {
//               setGroup({ enabled: true, members: [] });
//             }}
//           />
//         )}

//         {group.enabled &&
//           group.members.length > 0 &&
//           group.members.map((m, index) => {
//             const preferredName = getProfileQueryData(m.xmtpId)?.name;

//             return (
//               <Button
//                 key={m.address}
//                 text={preferredName}
//                 variant="fill"
//                 size="md"
//                 picto="xmark"
//                 style={styles.groupMemberButton}
//                 onPress={() =>
//                   setGroup((g) => {
//                     const members = [...g.members];
//                     members.splice(index, 1);
//                     return {
//                       ...g,
//                       members,
//                     };
//                   })
//                 }
//               />
//             );
//           })}
//       </View>

//       {!status.loading && !isEmptyObject(status.profileSearchResults) && (
//         // TODO
//         <View />
//       )}

//       <ScrollView
//         style={[styles.modal, { height: undefined }]}
//         keyboardShouldPersistTaps="handled"
//         onTouchStart={() => {
//           inputRef.current?.blur();
//         }}
//       >
//         {!status.loading && isEmptyObject(status.profileSearchResults) && (
//           <View style={styles.messageContainer}>
//             {status.error ? (
//               <Text style={[styles.message, styles.error]}>{status.error}</Text>
//             ) : (
//               <Text style={styles.message}>
//                 <Text>
//                   Type the full address/domain of your contact (with
//                   .converse.xyz, .eth, .lens, .fc, .cb.id…)
//                 </Text>
//               </Text>
//             )}
//           </View>
//         )}

//         {status.loading && (
//           <ActivityIndicator style={styles.mainActivityIndicator} />
//         )}

//         {!status.loading && !!status.inviteToConverse && (
//           <TableView
//             items={[
//               {
//                 id: "inviteToConverse",
//                 leftView: <TableViewPicto symbol="link" />,
//                 title: translate("invite_to_group.invite_to_converse"),
//                 subtitle: "",
//                 action: () => {
//                   navigation.goBack();
//                   navigation.navigate("ShareProfile");
//                 },
//               },
//             ]}
//             style={styles.tableView}
//           />
//         )}
//       </ScrollView>
//     </View>
//   );
// }

// const useStyles = () => {
//   const colorScheme = useColorScheme();
//   return StyleSheet.create({
//     modal: {
//       flex: 1,
//       backgroundColor: backgroundColor(colorScheme),
//     },
//     messageContainer: {
//       ...Platform.select({
//         default: {
//           marginTop: 23,
//           paddingHorizontal: 16,
//         },
//         android: {
//           marginRight: 16,
//           marginLeft: 16,
//           marginTop: 16,
//         },
//       }),
//     },
//     message: {
//       ...Platform.select({
//         default: {
//           fontSize: 17,
//           textAlign: "center",
//         },
//         android: {
//           fontSize: 14,
//         },
//       }),

//       color: textSecondaryColor(colorScheme),
//     },
//     clickableText: {
//       color: primaryColor(colorScheme),
//       fontWeight: "500",
//     },
//     error: {
//       color:
//         Platform.OS === "android"
//           ? textSecondaryColor(colorScheme)
//           : textPrimaryColor(colorScheme),
//     },
//     mainActivityIndicator: {
//       marginTop: 23,
//     },
//     tableView: {
//       marginHorizontal: Platform.OS === "android" ? 0 : 18,
//     },
//     tableViewActivityIndicator: {
//       width: 32,
//       height: 32,
//       ...Platform.select({
//         default: { marginRight: 8 },
//         android: { marginLeft: 12, marginRight: -4 },
//       }),
//     },
//     group: {
//       minHeight: 50,
//       paddingBottom: Platform.OS === "ios" ? 10 : 0,
//       flexDirection: "row",
//       alignItems: "center",
//       paddingLeft: Platform.OS === "ios" ? 16 : 0,
//       justifyContent: "flex-start",
//       borderBottomWidth: Platform.OS === "android" ? 1 : 0.5,
//       borderBottomColor: itemSeparatorColor(colorScheme),
//       backgroundColor: backgroundColor(colorScheme),
//       flexWrap: "wrap",
//     },
//     groupMemberButton: {
//       padding: 0,
//       marginHorizontal: 0,
//       marginRight: 10,
//       // height: Platform.OS === "ios" ? 30 : undefined,
//       marginTop: 10,
//     },
//     activityIndicator: {
//       marginRight: 5,
//     },
//     searchContainer: {
//       flex: 1,
//       backgroundColor: backgroundColor(colorScheme),
//     },
//     newGroupButton: {
//       marginLeft: 7,
//       paddingTop: Platform.OS === "ios" ? 13 : 10,
//       paddingBottom: Platform.OS === "ios" ? 0 : 10,
//     },
//   });
// };

// /* eslint-disable react-native/no-inline-styles */
// import { useLogout } from "@/features/authentication/use-logout.hook";
// import { logger } from "@/utils/logger";
// import { usePrivy } from "@privy-io/expo";
// import { ethers, utils as ethersUtils } from "ethers";
// import React, { useEffect, useState } from "react";
// import {
//   Button,
//   SafeAreaView,
//   ScrollView,
//   Text,
//   TextInput,
//   View,
// } from "react-native";
// import { useAuthenticateWithPasskey } from "../authentication/authenticate-with-passkey.context";
// import { ensureJwtQueryData } from "../authentication/jwt.query";
// import { useCreateUser } from "../current-user/use-create-user";
// import {
//   AuthStatuses,
//   useMultiInboxStore,
//   useCurrentSenderProfile,
//   useCurrentSender,
// } from "../multi-inbox/multi-inbox.store";
// import { useSocialProfilesForAddressQuery } from "../social-profiles/social-lookup.query";
// import { ConnectWalletBottomSheet } from "../wallets/connect-wallet.bottom-sheet";

// const AddressDebugger = ({ address }: { address: string }) => {
//   const {
//     data: profiles,
//     status,
//     error,
//   } = useSocialProfilesForAddressQuery({
//     ethAddress: address,
//   });

//   useEffect(() => {
//     async function debugAddress() {
//       try {
//         // Validate and format the address
//         const isValidAddress = ethersUtils.isAddress(address);
//         const checksummedAddress = ethersUtils.getAddress(address);
//         const lowercaseAddress = address.toLowerCase();

//         logger.debug("[AddressDebugger] Address Analysis:", {
//           originalAddress: address,
//           isValidAddress,
//           checksummedAddress,
//           lowercaseAddress,
//         });

//         // Try ENS resolution with different address formats
//         const provider = new ethers.providers.AlchemyProvider("mainnet");

//         const [originalEns, checksumEns, lowercaseEns] = await Promise.all([
//           provider.lookupAddress(address),
//           provider.lookupAddress(checksummedAddress),
//           provider.lookupAddress(lowercaseAddress),
//         ]);

//         logger.debug("[AddressDebugger] ENS Results:", {
//           originalEns,
//           checksumEns,
//           lowercaseEns,
//         });

//         if (checksumEns) {
//           const resolver = await provider.getResolver(checksumEns);
//           if (resolver) {
//             const avatar = await resolver.getText("avatar");
//             const email = await resolver.getText("email");
//             const url = await resolver.getText("url");
//             const twitter = await resolver.getText("com.twitter");
//             const github = await resolver.getText("com.github");

//             logger.debug("[AddressDebugger] ENS Records for", checksumEns, {
//               avatar,
//               email,
//               url,
//               twitter,
//               github,
//             });
//           }
//         }
//       } catch (err) {
//         logger.error("[AddressDebugger] Error:", err);
//       }
//     }

//     debugAddress();
//   }, [address]);

//   useEffect(() => {
//     if (profiles) {
//       logger.debug(
//         "[AddressDebugger] Thirdweb Social Profiles for",
//         address,
//         ":",
//         profiles
//       );
//     }
//     if (error) {
//       logger.error("[AddressDebugger] Thirdweb Social Profiles Error:", error);
//     }
//   }, [profiles, error, address]);

//   return (
//     <View
//       style={{
//         marginTop: 20,
//         padding: 10,
//         borderTopWidth: 1,
//         borderTopColor: "rgba(0,0,0,0.1)",
//       }}
//     >
//       <Text style={{ fontWeight: "bold" }}>Address Debug Information</Text>
//       <Text>Original: {address}</Text>
//       <Text>Checksum: {ethersUtils.getAddress(address)}</Text>
//       <Text>Status: {status}</Text>
//       {profiles && (
//         <Text>
//           Found {profiles.length} social profile(s). Check debug logs for
//           details.
//         </Text>
//       )}
//       {error && <Text style={{ color: "red" }}>Error: {error.message}</Text>}
//     </View>
//   );
// };

// const NameResolver = () => {
//   const [name, setName] = useState("halfjew22.cb.id");
//   const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

//   useEffect(() => {
//     async function resolveName() {
//       try {
//         const provider = new ethers.providers.AlchemyProvider("mainnet");

//         // Try to resolve the name
//         const address = await provider.resolveName(name);
//         logger.debug(`[NameResolver] Resolved ${name} to:`, address);

//         // Additional Coinbase-specific logging
//         if (name.endsWith(".cb.id")) {
//           logger.debug("[NameResolver] This is a Coinbase ID");

//           // Log the parts of the cb.id
//           const [username] = name.split(".");
//           logger.debug("[NameResolver] Coinbase username:", username);

//           // Construct the Coinbase profile URL
//           const cbProfileUrl = `https://www.coinbase.com/${username}`;
//           logger.debug("[NameResolver] Coinbase Profile URL:", cbProfileUrl);
//         }

//         setResolvedAddress(address);

//         if (address) {
//           // If we got an address, let's get any associated records
//           const resolver = await provider.getResolver(name);
//           if (resolver) {
//             const avatar = await resolver.getText("avatar");
//             const email = await resolver.getText("email");
//             const url = await resolver.getText("url");
//             const twitter = await resolver.getText("com.twitter");
//             const github = await resolver.getText("com.github");

//             logger.debug(`[NameResolver] Records for ${name}:`, {
//               avatar,
//               email,
//               url,
//               twitter,
//               github,
//             });
//           }
//         }
//       } catch (err) {
//         logger.error("[NameResolver] Error resolving name:", err);
//         setResolvedAddress(null);
//       }
//     }

//     if (name) {
//       resolveName();
//     }
//   }, [name]);

//   const isCoinbaseId = name.endsWith(".cb.id");
//   const username = isCoinbaseId ? name.split(".")[0] : null;

//   return (
//     <View
//       style={{
//         marginTop: 20,
//         padding: 10,
//         borderTopWidth: 1,
//         borderTopColor: "rgba(0,0,0,0.1)",
//       }}
//     >
//       <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
//         Name Resolution
//       </Text>
//       <TextInput
//         value={name}
//         onChangeText={setName}
//         style={{
//           borderWidth: 1,
//           borderColor: "rgba(0,0,0,0.1)",
//           padding: 10,
//           marginBottom: 10,
//           borderRadius: 5,
//         }}
//         placeholder="Enter ENS or cb.id name"
//       />
//       <Text>Resolved Address: {resolvedAddress || "Not found"}</Text>
//       {isCoinbaseId && username && (
//         <View style={{ marginTop: 10 }}>
//           <Text style={{ fontWeight: "bold" }}>Coinbase Information:</Text>
//           <Text>Username: {username}</Text>
//           <Text>Profile URL: https://www.coinbase.com/{username}</Text>
//         </View>
//       )}
//       {resolvedAddress && <AddressDebugger address={resolvedAddress} />}
//     </View>
//   );
// };

// export function PrivyPlaygroundLandingScreen() {
//   const { loginWithPasskey, signupWithPasskey } = useAuthenticateWithPasskey();
//   const authStatus = useMultiInboxStore((state) => state.authStatus);
//   const isSigningUp = authStatus === AuthStatuses.signingUp;
//   const currentSender = useCurrentSender();
//   const { user: privyUser } = usePrivy();
//   // const authStatus = useAuthStatus();
//   // const { data: jwt } = useJwtQuery();
//   const { logout } = useLogout();
//   const { mutate: createUser, isPending: isCreatingUser } = useCreateUser();
//   const canCreateUser =
//     currentSender?.ethereumAddress !== undefined &&
//     currentSender.inboxId !== undefined &&
//     isSigningUp;

//   // const {
//   //   data: currentProfile,
//   //   status: currentProfileStatus,
//   //   error,
//   // } = useCurrentProfile();

//   const [
//     shouldShowConnectWalletBottomSheet,
//     setShouldShowConnectWalletBottomSheet,
//   ] = useState(false);

//   return (
//     <SafeAreaView>
//       <ScrollView style={{ borderColor: "rgba(0,0,0,0.1)", borderWidth: 1 }}>
//         <View
//           style={{
//             padding: 20,
//             flex: 1,
//             justifyContent: "center",
//             alignContent: "center",
//           }}
//         >
//           {canCreateUser && (
//             <Button
//               title="Create User"
//               onPress={() =>
//                 createUser(
//                   {
//                     privyUserId: privyUser!.id,
//                     smartContractWalletAddress: currentSender.ethereumAddress,
//                     inboxId: currentSender.inboxId,
//                     profile: {
//                       name: `Test User: ${Math.random()}`,
//                       avatar: "https://placehold.co/100x100",
//                       description: "random description",
//                     },
//                   },
//                   {
//                     async onSuccess(data, variables, context) {
//                       logger.debug(
//                         "Successfully created user",
//                         data,
//                         variables,
//                         context
//                       );
//                       const jwt = await ensureJwtQueryData();
//                       logger.debug(
//                         "Successfully created user and got JWT",
//                         jwt
//                       );
//                     },
//                     onError(error, variables, context) {
//                       logger.error(
//                         "Error creating user",
//                         error,
//                         variables,
//                         context
//                       );
//                     },
//                   }
//                 )
//               }
//             />
//           )}
//           {/* <Text>JWT: {JSON.stringify(!!jwt ? jwt : "nothin", null, 2)}</Text> */}
//           <Text>
//             Something: {JSON.stringify({ authStatus, isCreatingUser }, null, 2)}
//           </Text>
//           <Text>Current Sender: {JSON.stringify(currentSender, null, 2)}</Text>
//           {/* <Text>Current Profile Status: {currentProfileStatus}</Text> */}
//           {/* <Text>Current Profile Error: {error?.message}</Text> */}
//           {/* <Text>
//             Current Profile: {JSON.stringify(currentProfile, null, 2)}
//           </Text> */}

//           <Button
//             title="Connect Wallet"
//             disabled={authStatus !== AuthStatuses.signedIn}
//             onPress={() => setShouldShowConnectWalletBottomSheet(true)}
//           />

//           <Button
//             disabled={authStatus !== AuthStatuses.signedOut}
//             title="Login with Passkey"
//             onPress={loginWithPasskey}
//           />
//           <Button
//             disabled={authStatus !== AuthStatuses.signedOut}
//             title="Signup with Passkey"
//             onPress={signupWithPasskey}
//           />
//           <Button
//             disabled={authStatus !== AuthStatuses.signedIn}
//             title="Logout"
//             onPress={logout}
//           />
//           {/* <ConnectWalletBottomSheet
//             isVisible={shouldShowConnectWalletBottomSheet}
//             onClose={() => {}}
//             onWalletImported={() => {
//               alert("wallet imported");
//               setShouldShowConnectWalletBottomSheet(false);
//             }}
//           /> */}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

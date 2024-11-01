import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform } from "react-native";

export const authScreensSharedScreenOptions: NativeStackNavigationOptions = {
  headerTitle: "",
  headerBackTitle: "Back",
  headerBackTitleVisible: false,
  headerShadowVisible: false,
};

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

// export function IdleNavigation() {
//   return (
//     <NativeStack.Navigator
//       screenListeners={screenListeners("fullStackNavigation")}
//     >
//       <NativeStack.Screen
//         options={{
//           headerShown: false,
//         }}
//         name="Idle"
//         component={IdleScreen}
//       />
//     </NativeStack.Navigator>
//   );
// }

// export function SignedInNavigation() {
//   const colorScheme = useColorScheme();
//   const router = useRouter();

//   return (
//     <NativeStack.Navigator
//       screenListeners={screenListeners("fullStackNavigation")}
//     >
//       <NativeStack.Group>
//         <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
//           {ConversationListNav()}
//           {ConversationRequestsListNav()}
//           {ConversationBlockedListNav()}
//           {ConversationNav()}
//           {NewConversationNav()}
//           {ConverseMatchMakerNav()}
//           {ShareProfileNav()}
//           {ShareFrameNav()}
//           {WebviewPreviewNav()}
//           {ProfileNav()}
//           {GroupNav()}
//           {GroupLinkNav()}
//           {GroupInviteNav()}
//           {TopUpNav()}
//         </NativeStack.Group>

//         {/* Modals */}
//         <NativeStack.Group
//           screenOptions={{
//             presentation: "modal",
//             ...stackGroupScreenOptions(colorScheme),
//           }}
//         >
//           {UserProfileNav()}
//           <NativeStack.Screen
//             name="Accounts"
//             component={Accounts}
//             options={{
//               headerLargeTitle: true,
//               headerShadowVisible: false,
//               headerLeft: () => (
//                 <ScreenHeaderModalCloseButton onPress={router.goBack} />
//               ),
//             }}
//           />
//           <NativeStack.Screen
//             name="NewAccountUserProfile"
//             component={NewAccountUserProfileScreen}
//             options={{
//               headerLeft: () => (
//                 <ScreenHeaderModalCloseButton onPress={router.goBack} />
//               ),
//               headerTitle: "Modify profile",
//             }}
//           />
//           <NativeStack.Screen
//             name="NewAccountNavigator"
//             component={NewAccountNavigator}
//             options={{
//               headerShown: false,
//             }}
//           />
//         </NativeStack.Group>
//       </NativeStack.Group>
//     </NativeStack.Navigator>
//   );
// }

// export function SignedOutNavigation() {
//   const colorScheme = useColorScheme();

//   return (
//     <NativeStack.Navigator
//       screenListeners={screenListeners("fullStackNavigation")}
//     >
//       <NativeStack.Group>
//         {/* Auth / Onboarding */}
//         <NativeStack.Group
//           screenOptions={{
//             ...stackGroupScreenOptions(colorScheme),
//             ...authScreensSharedScreenOptions,
//           }}
//         >
//           <NativeStack.Screen
//             options={{
//               headerShown: false,
//             }}
//             name="OnboardingGetStarted"
//             component={OnboardingGetStartedScreen}
//           />
//           <NativeStack.Screen
//             name="OnboardingPrivy"
//             component={OnboardingPrivyScreen}
//           />
//           <NativeStack.Screen
//             name="OnboardingConnectWallet"
//             component={OnboardingConnectWalletScreen}
//           />
//           <NativeStack.Screen
//             name="OnboardingNotifications"
//             component={OnboardingNotificationsScreen}
//           />
//           <NativeStack.Screen
//             name="OnboardingUserProfile"
//             component={OnboardingUserProfileScreen}
//           />
//           <NativeStack.Screen
//             name="OnboardingPrivateKey"
//             component={OnboardingPrivateKeyScreen}
//           />
//           <NativeStack.Screen
//             name="OnboardingEphemeral"
//             component={OnboardingEphemeraScreen}
//           />
//         </NativeStack.Group>
//       </NativeStack.Group>
//     </NativeStack.Navigator>
//   );
// }

// const NewAccountStack = createNativeStackNavigator<NavigationParamList>();

// const NewAccountNavigator = memo(function NewAccountNavigator() {
//   const colorScheme = useColorScheme();
//   const router = useRouter();

//   return (
//     <NewAccountStack.Navigator>
//       <NewAccountStack.Group
//         screenOptions={{
//           headerTitle: "",
//           headerBackTitle: "Back",
//           ...stackGroupScreenOptions(colorScheme),
//         }}
//       >
//         <NativeStack.Screen
//           name="NewAccount"
//           component={NewAccountScreen}
//           options={{
//             headerTitle: "New account",
//             headerLeft: () => (
//               <ScreenHeaderModalCloseButton
//                 title="Cancel"
//                 onPress={router.goBack}
//               />
//             ),
//           }}
//         />
//         <NewAccountStack.Screen
//           name="NewAccountPrivy"
//           component={NewAccountPrivyScreen}
//         />
//         <NewAccountStack.Screen
//           name="NewAccountConnectWallet"
//           component={NewAccountConnectWalletScreen}
//         />
//         <NewAccountStack.Screen
//           name="NewAccountPrivateKey"
//           component={NewAccountPrivateKeyScreen}
//         />
//         <NewAccountStack.Screen
//           name="NewAccountUserProfile"
//           component={NewAccountUserProfileScreen}
//         />
//         <NewAccountStack.Screen
//           name="NewAccountEphemera"
//           component={NewAccountEphemeraScreen}
//         />
//       </NewAccountStack.Group>
//     </NewAccountStack.Navigator>
//   );
// });

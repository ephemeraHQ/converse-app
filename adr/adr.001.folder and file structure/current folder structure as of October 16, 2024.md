```
technoplato@Michaels-MacBook-Pro converse-app % tree -L 3 -I node_modules
.
├── App.tsx
├── App.web.tsx
├── LICENSE
├── README.md
├── __mocks__
│   └── @xmtp
│       └── react-native-sdk.ts
├── adr
│   ├── adr.000.readme.md
│   └── adr.001.folder structure
│       ├── adr.001.folder structure.md
│       └── current folder structure October 16, 2024.txt
├── android
│   ├── app
│   │   ├── build.gradle
│   │   ├── debug.keystore
│   │   ├── google-services.json
│   │   ├── proguard-rules.pro
│   │   └── src
│   ├── build.gradle
│   ├── gradle
│   │   └── wrapper
│   ├── gradle.properties
│   ├── gradlew
│   ├── gradlew.bat
│   ├── sentry.properties
│   └── settings.gradle
├── app.config.ts
├── app.json
├── assets
│   ├── Encrypted.tsx
│   ├── adaptive-icon.png
│   ├── baseUSDCOnly-dark.png
│   ├── baseUSDCOnly-light.png
│   ├── checkmark.svg
│   ├── clock.svg
│   ├── ellipse.svg
│   ├── encrypted.svg
│   ├── exclamationmark.triangle.svg
│   ├── favicon.png
│   ├── frameLink.svg
│   ├── icon-android
│   │   ├── background-preview.png
│   │   ├── background-prod.png
│   │   ├── foreground-preview.png
│   │   └── foreground-prod.png
│   ├── icon-loading.png
│   ├── icon-preview.png
│   ├── icon.png
│   ├── message-bubble.svg
│   ├── message-tail.svg
│   ├── reply.svg
│   ├── send-button-dark.svg
│   ├── send-button-higher.svg
│   ├── send-button-light.svg
│   ├── send-button.svg
│   ├── splash-dark.png
│   ├── splash.png
│   └── web.css
├── babel.config.js
├── components
│   ├── AccountSettingsButton.tsx
│   ├── ActivityIndicator
│   │   ├── ActivityIndicator.android.tsx
│   │   └── ActivityIndicator.tsx
│   ├── AndroidBackAction.tsx
│   ├── AnimatedBlurView.tsx
│   ├── Avatar.tsx
│   ├── Banner
│   │   ├── AnimatedBanner.tsx
│   │   └── Banner.tsx
│   ├── Button
│   │   ├── Button.ios.tsx
│   │   └── Button.tsx
│   ├── Chat
│   │   ├── ActionButton.tsx
│   │   ├── Attachment
│   │   ├── Chat.tsx
│   │   ├── ChatGroupUpdatedMessage.tsx
│   │   ├── ChatNullState.tsx
│   │   ├── ChatPlaceholder
│   │   ├── ConsentPopup
│   │   ├── Frame
│   │   ├── Input
│   │   ├── Message
│   │   └── Transaction
│   ├── ClickableText.tsx
│   ├── Connecting.tsx
│   ├── Conversation
│   │   └── ConversationTitle.tsx
│   ├── ConversationContextMenu.tsx
│   ├── ConversationFlashList.tsx
│   ├── ConversationList
│   │   ├── GroupConversationItem.tsx
│   │   ├── HiddenRequestsButton.tsx
│   │   ├── NewConversationButton.tsx
│   │   ├── ProfileSettingsButton.tsx
│   │   ├── RequestsButton.tsx
│   │   └── RequestsSegmentedController.tsx
│   ├── ConversationListItem.tsx
│   ├── DebugButton.tsx
│   ├── Drawer.tsx
│   ├── EmojiPicker
│   │   ├── EmojiRow.tsx
│   │   ├── EmojiRowList.tsx
│   │   └── EmojiSearchBar.tsx
│   ├── EphemeralAccountBanner.tsx
│   ├── ErroredHeader.tsx
│   ├── ExternalWalletPicker.tsx
│   ├── GroupAvatar.tsx
│   ├── Indicator.tsx
│   ├── InitialLoad.tsx
│   ├── NewConversation
│   │   └── SearchBar.tsx
│   ├── Onboarding
│   │   ├── AddressBook.tsx
│   │   ├── ConnectViaWallet.tsx
│   │   ├── CreateEphemeral.tsx
│   │   ├── DesktopConnect.tsx
│   │   ├── DesktopConnectFlow.tsx
│   │   ├── InviteCode.tsx
│   │   ├── OnboardingComponent.tsx
│   │   ├── PrivateKeyConnect.tsx
│   │   ├── PrivyConnect.tsx
│   │   ├── Terms.tsx
│   │   ├── UserProfile.tsx
│   │   ├── ValueProps.tsx
│   │   ├── WalletSelector.tsx
│   │   ├── WarpcastConnect.tsx
│   │   └── supportedWallets.ts
│   ├── Picto
│   │   ├── Picto.ios.tsx
│   │   └── Picto.tsx
│   ├── PinnedConversations
│   │   ├── PinnedConversation.tsx
│   │   └── PinnedConversations.tsx
│   ├── Recommendations
│   │   ├── Recommendation.tsx
│   │   └── Recommendations.tsx
│   ├── Search
│   │   ├── NavigationChatButton.tsx
│   │   ├── NoResult.tsx
│   │   ├── ProfileSearch.tsx
│   │   └── ProfileSearchItem.tsx
│   ├── StateHandlers
│   │   ├── ActionSheetStateHandler.tsx
│   │   ├── HydrationStateHandler.tsx
│   │   ├── InitialStateHandler.tsx
│   │   ├── MainIdentityStateHandler.tsx
│   │   ├── NetworkStateHandler.tsx
│   │   ├── NotificationsStateHandler.tsx
│   │   └── WalletsStateHandler.tsx
│   ├── SvgImageUri.tsx
│   ├── TableView
│   │   ├── TableView.ios.tsx
│   │   ├── TableView.tsx
│   │   └── TableViewImage.tsx
│   ├── XmtpEngine.tsx
│   └── __tests__
│       ├── ActivityIndicator.test.tsx
│       ├── Avatar.test.tsx
│       ├── Button.test.tsx
│       └── __snapshots__
├── config.ts
├── containers
│   ├── EmojiPicker.tsx
│   ├── GroupPendingRequestsTable.tsx
│   ├── GroupScreenAddition.tsx
│   ├── GroupScreenConsentTable.tsx
│   ├── GroupScreenDescription.tsx
│   ├── GroupScreenImage.tsx
│   ├── GroupScreenMembersTable.tsx
│   └── GroupScreenName.tsx
├── data
│   ├── db
│   │   ├── datasource.ts
│   │   ├── driver.ts
│   │   ├── entities
│   │   ├── index.ts
│   │   ├── index.web.ts
│   │   ├── logger.ts
│   │   ├── migrations
│   │   └── upsert.ts
│   ├── helpers
│   │   ├── conversations
│   │   ├── inboxId
│   │   ├── messages
│   │   └── profiles
│   ├── index.ts
│   ├── mappers.ts
│   ├── store
│   │   ├── accountsStore.ts
│   │   ├── appStore.ts
│   │   ├── chatStore.ts
│   │   ├── framesStore.ts
│   │   ├── inboxIdStore.ts
│   │   ├── onboardingStore.ts
│   │   ├── profilesStore.ts
│   │   ├── recommendationsStore.ts
│   │   ├── settingsStore.ts
│   │   ├── storeHelpers.ts
│   │   ├── transactionsStore.ts
│   │   └── walletStore.ts
│   └── updates
│       ├── 001-setConsent.ts
│       ├── 002-setTopicsData.ts
│       └── asyncUpdates.ts
├── design-system
│   ├── Hstack.tsx
│   ├── Pressable.tsx
│   ├── ScrollView.tsx
│   ├── Text
│   │   ├── AnimatedText.tsx
│   │   ├── Text.presets.ts
│   │   ├── Text.props.ts
│   │   ├── Text.styles.ts
│   │   ├── Text.tsx
│   │   └── index.ts
│   ├── Title.tsx
│   ├── TouchableOpacity.tsx
│   └── VStack.tsx
├── eas.json
├── hooks
│   ├── useDisconnectActionSheet.ts
│   ├── useExistingGroupInviteLink.ts
│   ├── useGroupConsent.ts
│   ├── useGroupCreator.ts
│   ├── useGroupDescription.ts
│   ├── useGroupId.ts
│   ├── useGroupMembers.ts
│   ├── useGroupName.ts
│   ├── useGroupPendingRequests.ts
│   ├── useGroupPermissions.ts
│   ├── useGroupPhoto.ts
│   ├── usePhotoSelect.ts
│   └── useShouldShowErrored.ts
├── i18n
│   ├── i18n.ts
│   ├── index.ts
│   ├── translate.ts
│   └── translations
│       └── en.ts
├── index.js
├── ios
│   ├── Converse
│   │   ├── AppDelegate.h
│   │   ├── AppDelegate.mm
│   │   ├── Converse.entitlements
│   │   ├── Images.xcassets
│   │   ├── Info.plist
│   │   ├── SplashScreen.storyboard
│   │   ├── Supporting
│   │   ├── main.m
│   │   └── noop-file.swift
│   ├── Converse.xcodeproj
│   │   ├── project.pbxproj
│   │   └── xcshareddata
│   ├── Converse.xcworkspace
│   │   ├── contents.xcworkspacedata
│   │   ├── xcshareddata
│   │   └── xcuserdata
│   ├── ConverseNotificationExtension
│   │   ├── ConverseNotificationExtension.entitlements
│   │   ├── Datatypes.swift
│   │   ├── Info.plist
│   │   ├── Keychain.swift
│   │   ├── MMKV.swift
│   │   ├── NotificationService.swift
│   │   ├── NotificationUtils.swift
│   │   ├── Profile.swift
│   │   ├── SQLite.swift
│   │   ├── Sentry.swift
│   │   ├── SharedDefaults.swift
│   │   ├── Spam.swift
│   │   ├── Utils.swift
│   │   └── Xmtp
│   ├── Gemfile
│   ├── Gemfile.lock
│   ├── Podfile
│   ├── Podfile.lock
│   ├── Podfile.properties.json
│   ├── Pods
│   │   ├── BigInt
│   │   ├── CoinbaseWalletSDK
│   │   ├── ComputableLayout
│   │   ├── Connect-Swift
│   │   ├── ContextMenuAuxiliaryPreview
│   │   ├── DGSwiftUtilities
│   │   ├── DoubleConversion
│   │   ├── GenericJSON
│   │   ├── GzipSwift
│   │   ├── Headers
│   │   ├── LibXMTP
│   │   ├── Local Podspecs
│   │   ├── Logging
│   │   ├── MMKV
│   │   ├── MMKVAppExtension
│   │   ├── MMKVCore
│   │   ├── Manifest.lock
│   │   ├── MessagePacker
│   │   ├── OpenSSL-Universal
│   │   ├── Pods.xcodeproj
│   │   ├── RCT-Folly
│   │   ├── ReachabilitySwift
│   │   ├── SDWebImage
│   │   ├── SDWebImageAVIFCoder
│   │   ├── SDWebImageSVGCoder
│   │   ├── SDWebImageWebPCoder
│   │   ├── SQLite.swift
│   │   ├── Sentry
│   │   ├── SocketRocket
│   │   ├── SwiftProtobuf
│   │   ├── Target Support Files
│   │   ├── XMTP
│   │   ├── boost
│   │   ├── fmt
│   │   ├── glog
│   │   ├── hermes-engine
│   │   ├── hermes-engine-artifacts
│   │   ├── libavif
│   │   ├── libdav1d
│   │   ├── libwebp
│   │   ├── secp256k1.swift
│   │   ├── sqlite3
│   │   └── web3.swift
│   ├── PrivacyInfo.xcprivacy
│   ├── build
│   │   └── generated
│   └── sentry.properties
├── jest.setup.ts
├── metro.config.js
├── package.json
├── patches
│   ├── @op-engineering+op-sqlite+6.0.1.patch
│   ├── @xmtp+user-preferences-bindings-wasm+0.3.6.patch
│   ├── react-native+0.74.5.patch
│   ├── react-native-fetch-api+3.0.0.patch
│   ├── react-native-mmkv+2.12.2.patch
│   ├── react-native-paper+5.10.6.patch
│   ├── react-native-parsed-text+0.0.22.patch
│   ├── react-native-phone-number-input+2.1.0.patch
│   ├── react-native-sfsymbols+1.2.1.patch
│   ├── react-native-shared-group-preferences+1.1.23.patch
│   ├── react-native-sqlite-storage+6.0.1.patch
│   └── typeorm+0.3.20.patch
├── polyfills.ts
├── polyfills.web.ts
├── public
│   └── wasm
│       └── user_preferences_bindings_wasm_bg.wasm
├── queries
│   ├── MutationKeys.test.ts
│   ├── MutationKeys.ts
│   ├── QueryKeys.test.ts
│   ├── QueryKeys.ts
│   ├── __snapshots__
│   │   ├── MutationKeys.test.ts.snap
│   │   └── QueryKeys.test.ts.snap
│   ├── entify.test.ts
│   ├── entify.ts
│   ├── queryClient.ts
│   ├── useAddToGroupMutation.ts
│   ├── useAllowGroupMutation.ts
│   ├── useBlockGroupMutation.ts
│   ├── useCreateGroupJoinRequestMutation.ts
│   ├── useGroupConsentQuery.ts
│   ├── useGroupDescriptionMutation.ts
│   ├── useGroupDescriptionQuery.ts
│   ├── useGroupFirstMessageQuery.ts
│   ├── useGroupInviteQuery.ts
│   ├── useGroupIsActive.ts
│   ├── useGroupJoinRequestQuery.ts
│   ├── useGroupMembersQuery.ts
│   ├── useGroupMessages.ts
│   ├── useGroupNameMutation.ts
│   ├── useGroupNameQuery.ts
│   ├── useGroupPendingMessages.ts
│   ├── useGroupPermissionsQuery.ts
│   ├── useGroupPhotoMutation.ts
│   ├── useGroupPhotoQuery.ts
│   ├── useGroupPinnedFrameQuery.ts
│   ├── useGroupQuery.ts
│   ├── useGroupsQuery.ts
│   ├── usePendingRequestsQuery.ts
│   ├── usePromoteToAdminMutation.ts
│   ├── usePromoteToSuperAdminMutation.ts
│   ├── useRemoveFromGroupMutation.ts
│   ├── useRevokeAdminMutation.ts
│   └── useRevokeSuperAdminMutation.ts
├── react-native.config.js
├── screens
│   ├── Accounts
│   │   ├── Accounts.tsx
│   │   ├── AccountsAndroid.tsx
│   │   ├── AccountsDrawer.tsx
│   │   └── AccountsDrawer.web.tsx
│   ├── Conversation.tsx
│   ├── ConversationList.tsx
│   ├── ConversationReadOnly.tsx
│   ├── ConverseMatchMaker.tsx
│   ├── EnableTransactions.tsx
│   ├── Group.tsx
│   ├── GroupInvite.tsx
│   ├── GroupLink.tsx
│   ├── Main.tsx
│   ├── Navigation
│   │   ├── AccountsNav.tsx
│   │   ├── ConversationBlockedListNav.tsx
│   │   ├── ConversationListNav.ios.tsx
│   │   ├── ConversationListNav.tsx
│   │   ├── ConversationNav.tsx
│   │   ├── ConversationRequestsListNav.ios.tsx
│   │   ├── ConversationRequestsListNav.tsx
│   │   ├── ConverseMatchMakerNav.tsx
│   │   ├── EnableTransactionsNav.tsx
│   │   ├── GroupInviteNav.tsx
│   │   ├── GroupLinkNav.tsx
│   │   ├── GroupNav.tsx
│   │   ├── Navigation.tsx
│   │   ├── NewConversationNav.tsx
│   │   ├── ProfileNav.tsx
│   │   ├── ShareFrameNav.tsx
│   │   ├── ShareProfileNav.tsx
│   │   ├── SplitScreenNavigation
│   │   ├── TopUpNav.tsx
│   │   ├── UserProfileNav.tsx
│   │   ├── WebviewPreviewNav.tsx
│   │   ├── navHelpers.test.ts
│   │   └── navHelpers.ts
│   ├── NewConversation
│   │   ├── NewConversation.tsx
│   │   ├── NewConversationModal.tsx
│   │   └── NewGroupSummary.tsx
│   ├── NotificationsScreen.tsx
│   ├── Onboarding.tsx
│   ├── Onboarding.web.tsx
│   ├── Profile.tsx
│   ├── ShareProfile.tsx
│   ├── TopUp.tsx
│   ├── WebviewPreview.tsx
│   └── WebviewPreview.web.tsx
├── scripts
│   ├── build
│   │   ├── android
│   │   ├── build.js
│   │   ├── eas.js
│   │   ├── incrementBuildNumbers.js
│   │   ├── incrementVersion.js
│   │   ├── ios
│   │   ├── release_notes.sh
│   │   └── update.js
│   ├── migrations
│   │   ├── converse-sample.sqlite
│   │   ├── datasource.ts
│   │   ├── db.ts
│   │   ├── entities
│   │   └── tsconfig.json
│   ├── vercelBuild.sh
│   └── wasm.js
├── styles
│   ├── colors
│   │   ├── helpers.android.ts
│   │   ├── helpers.ts
│   │   └── index.ts
│   └── sizes
│       └── index.ts
├── theme
│   ├── animations.ts
│   ├── border-radius.ts
│   ├── borders.ts
│   ├── colors.ts
│   ├── colorsDark.ts
│   ├── index.ts
│   ├── spacing.ts
│   ├── timing.ts
│   ├── typography.ts
│   └── useAppTheme.ts
├── tsconfig.json
├── types
│   ├── images.d.ts
│   └── react-native.d.ts
├── utils
│   ├── addressBook.ts
│   ├── alert.ts
│   ├── analytics.ts
│   ├── animations
│   │   ├── index.ts
│   │   ├── keyboardAnimation.ios.ts
│   │   └── keyboardAnimation.ts
│   ├── api.test.ts
│   ├── api.ts
│   ├── appState.ts
│   ├── array.ts
│   ├── attachment
│   │   ├── helpers.ts
│   │   ├── index.ts
│   │   └── index.web.ts
│   ├── background.tsx
│   ├── cache
│   │   ├── cache.ts
│   │   └── cache.web.ts
│   ├── coinbaseWallet.ts
│   ├── contextMenu
│   │   ├── calculateMenuHeight.ts
│   │   ├── constants.ts
│   │   ├── deepEqual.ts
│   │   └── types.ts
│   ├── conversation
│   │   └── showUnreadOnConversation.ts
│   ├── conversation.ts
│   ├── conversationList.ts
│   ├── date.test.ts
│   ├── date.ts
│   ├── debug.ts
│   ├── device.ts
│   ├── emojis
│   │   ├── emojis.ts
│   │   ├── favoritedEmojis.ts
│   │   └── interfaces.ts
│   ├── ethos.ts
│   ├── events.ts
│   ├── evm
│   │   ├── abis
│   │   ├── address.ts
│   │   ├── erc20.ts
│   │   ├── external.ts
│   │   ├── external.web.ts
│   │   ├── helpers.ts
│   │   ├── mnemonic.ts
│   │   ├── privy.ts
│   │   ├── privy.web.ts
│   │   ├── provider.ts
│   │   └── xmtp.ts
│   ├── fileSystem
│   │   ├── index.ts
│   │   └── index.web.ts
│   ├── frames.ts
│   ├── getFirstLetterForAvatar.ts
│   ├── groupInvites.ts
│   ├── groupUtils
│   │   ├── adminUtils.test.ts
│   │   ├── adminUtils.ts
│   │   ├── getGroupMemberActions.test.ts
│   │   ├── getGroupMemberActions.ts
│   │   ├── groupActionHandlers.ts
│   │   ├── groupId.test.ts
│   │   ├── groupId.ts
│   │   ├── memberCanUpdateGroup.ts
│   │   ├── sortGroupMembersByAdminStatus.test.ts
│   │   └── sortGroupMembersByAdminStatus.ts
│   ├── haptics.ts
│   ├── keyboard.ts
│   ├── keychain
│   │   ├── helpers.ts
│   │   ├── index.ts
│   │   └── index.web.ts
│   ├── lens.ts
│   ├── logger.ts
│   ├── logger.web.ts
│   ├── logout
│   │   ├── index.tsx
│   │   ├── privy.tsx
│   │   ├── privy.web.tsx
│   │   ├── wallet.tsx
│   │   └── wallet.web.tsx
│   ├── map.ts
│   ├── media.ts
│   ├── message.ts
│   ├── messageContent.test.ts
│   ├── messageContent.ts
│   ├── mmkv.ts
│   ├── navigation.ts
│   ├── notifications.ts
│   ├── notifications.web.ts
│   ├── objects.ts
│   ├── perf
│   │   └── withRenderTime.tsx
│   ├── profile.ts
│   ├── reactions.ts
│   ├── recommendations.ts
│   ├── regex.ts
│   ├── retryWithBackoff.test.ts
│   ├── retryWithBackoff.ts
│   ├── search.ts
│   ├── sentry.ts
│   ├── set.test.ts
│   ├── set.ts
│   ├── share.ts
│   ├── share.web.ts
│   ├── sharedData.tsx
│   ├── splash
│   │   ├── splash.android.tsx
│   │   └── splash.tsx
│   ├── str.test.ts
│   ├── str.ts
│   ├── test
│   │   └── xmtp.ts
│   ├── thirdweb.ts
│   ├── transaction.ts
│   ├── uns.ts
│   ├── wait.test.ts
│   ├── wait.ts
│   ├── wallet.ts
│   └── xmtpRN
│       ├── api.ts
│       ├── attachments.ts
│       ├── attachments.web.ts
│       ├── client.ts
│       ├── client.web.ts
│       ├── contentTypes
│       ├── conversations.ts
│       ├── conversations.web.ts
│       ├── logs.ts
│       ├── logs.web.ts
│       ├── messages.ts
│       ├── messages.web.ts
│       ├── revoke.ts
│       ├── send.ts
│       ├── send.web.ts
│       ├── signIn.ts
│       ├── signIn.web.ts
│       └── sync.ts
├── vendor
│   └── humanhash.js
├── vercel.json
├── wdyr.js
└── yarn.lock

150 directories, 478 files
technoplato@Michaels-MacBook-Pro converse-app % 
```
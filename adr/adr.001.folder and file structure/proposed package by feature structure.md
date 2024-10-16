# Proposed Folder Structure (October 16, 2024)

This is an approximation of what our end goal will look like. I've attempted to organize the current Converse App files list into the newly proposed folder structure. There will be differences between this and what we end up with, but this should give us a good idea of what to expect.

## Root Structure

```
converse-app/
├── features/
│   ├── accounts/
│   ├── conversations/
│   ├── groups/
│   ├── transactions/
│   ├── profiles/
│   ├── search/
│   ├── notifications/
│   ├── frames/
│   ├── recommendations/
│   └── settings/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── data/
│   └── queries/
├── assets/
├── config/
├── adr/
├── scripts/
├── public/
├── android/
├── ios/
├── patches/
├── vendor/
└── [other root-level files]
```

## Detailed Structure

```
converse-app/
├── features/
│   ├── accounts/
│   │   ├── components/
│   │   │   ├── AccountSettingsButton.tsx
│   │   │   ├── ExternalWalletPicker.tsx
│   │   │   ├── EphemeralAccountBanner.tsx
│   │   │   ├── ProfileSettingsButton.tsx
│   │   │   ├── Logout/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── privy.tsx
│   │   │   │   ├── privy.web.tsx
│   │   │   │   ├── wallet.tsx
│   │   │   │   └── wallet.web.tsx
│   │   ├── screens/
│   │   │   ├── Accounts.tsx
│   │   │   ├── AccountsAndroid.tsx
│   │   │   └── Onboarding/
│   │   │       ├── Onboarding.tsx
│   │   │       ├── Onboarding.web.tsx
│   │   │       └── components/
│   │   │           ├── AddressBook.tsx
│   │   │           ├── ConnectViaWallet.tsx
│   │   │           ├── CreateEphemeral.tsx
│   │   │           ├── DesktopConnect.tsx
│   │   │           ├── DesktopConnectFlow.tsx
│   │   │           ├── InviteCode.tsx
│   │   │           ├── OnboardingComponent.tsx
│   │   │           ├── PrivateKeyConnect.tsx
│   │   │           ├── PrivyConnect.tsx
│   │   │           ├── Terms.tsx
│   │   │           ├── UserProfile.tsx
│   │   │           ├── ValueProps.tsx
│   │   │           ├── WalletSelector.tsx
│   │   │           ├── WarpcastConnect.tsx
│   │   │           └── supportedWallets.ts
│   │   ├── navigation/
│   │   │   ├── AccountsNav.tsx
│   │   │   ├── AccountsDrawer.tsx
│   │   │   └── OnboardingNav.tsx
│   │   ├── hooks/
│   │   │   ├── useDisconnectActionSheet.ts
│   │   │   └── usePhotoSelect.ts
│   │   ├── utils/
│   │   │   ├── addressBook.ts
│   │   │   ├── keychain/
│   │   │   │   ├── helpers.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── index.web.ts
│   │   │   ├── wallet.ts
│   │   │   └── evm/
│   │   │       ├── abis/
│   │   │       ├── address.ts
│   │   │       ├── erc20.ts
│   │   │       ├── external.ts
│   │   │       ├── external.web.ts
│   │   │       ├── helpers.ts
│   │   │       ├── mnemonic.ts
│   │   │       ├── privy.ts
│   │   │       ├── privy.web.ts
│   │   │       └── provider.ts
│   │   ├── data/
│   │   │   └── store/
│   │   │       ├── accountsStore.ts
│   │   │       └── walletStore.ts
│   │   └── accounts.client.ts
│   ├── conversations/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── Chat.tsx
│   │   │   │   ├── ChatGroupUpdatedMessage.tsx
│   │   │   │   ├── Message/
│   │   │   │   ├── Input/
│   │   │   │   ├── Attachment/
│   │   │   │   ├── Frame/
│   │   │   │   ├── ConsentPopup/
│   │   │   │   ├── Transaction/
│   │   │   │   └── ActionButton.tsx
│   │   │   ├── ConversationContextMenu.tsx
│   │   │   ├── ConversationFlashList.tsx
│   │   │   ├── ConversationListItem.tsx
│   │   │   ├── ConversationTitle.tsx
│   │   │   ├── ConversationNullState.tsx
│   │   │   ├── HiddenRequestsButton.tsx
│   │   │   ├── NewConversationButton.tsx
│   │   │   ├── RequestsButton.tsx
│   │   │   ├── RequestsSegmentedController.tsx
│   │   │   └── PinnedConversations/
│   │   │       ├── PinnedConversation.tsx
│   │   │       └── PinnedConversations.tsx
│   │   ├── screens/
│   │   │   ├── Conversation.tsx
│   │   │   ├── ConversationList.tsx
│   │   │   ├── ConversationReadOnly.tsx
│   │   │   ├── NewConversation/
│   │   │   │   ├── NewConversation.tsx
│   │   │   │   ├── NewConversationModal.tsx
│   │   │   │   ├── NewGroupSummary.tsx
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── ProfileSearchItem.tsx
│   │   │   └── Recommendations/
│   │   │       ├── Recommendation.tsx
│   │   │       └── Recommendations.tsx
│   │   ├── navigation/
│   │   │   ├── ConversationNav.tsx
│   │   │   ├── ConversationListNav.tsx
│   │   │   ├── ConversationRequestsListNav.tsx
│   │   │   └── NewConversationNav.tsx
│   │   ├── hooks/
│   │   │   ├── useExistingGroupInviteLink.ts
│   │   │   ├── useConversationHooks.ts
│   │   │   └── useShouldShowErrored.ts
│   │   ├── utils/
│   │   │   ├── conversation.ts
│   │   │   ├── conversationList.ts
│   │   │   ├── conversationHelpers.ts
│   │   │   └── xmtpRN/
│   │   │       ├── api.ts
│   │   │       ├── attachments.ts
│   │   │       ├── client.ts
│   │   │       ├── conversations.ts
│   │   │       ├── logs.ts
│   │   │       ├── messages.ts
│   │   │       ├── revoke.ts
│   │   │       ├── send.ts
│   │   │       ├── signIn.ts
│   │   │       └── sync.ts
│   │   ├── data/
│   │   │   ├── db/
│   │   │   │   ├── datasource.ts
│   │   │   │   ├── driver.ts
│   │   │   │   ├── entities/
│   │   │   │   ├── migrations/
│   │   │   │   └── upsert.ts
│   │   │   ├── store/
│   │   │   │   ├── chatStore.ts
│   │   │   │   ├── framesStore.ts
│   │   │   │   ├── inboxIdStore.ts
│   │   │   │   ├── recommendationsStore.ts
│   │   │   │   └── transactionsStore.ts
│   │   │   └── updates/
│   │   │       ├── 001-setConsent.ts
│   │   │       ├── 002-setTopicsData.ts
│   │   │       └── asyncUpdates.ts
│   │   └── queries/
│   │       ├── entify.ts
│   │       ├── queryClient.ts
│   │       ├── useGroupIsActive.ts
│   │       ├── useGroupMessages.ts
│   │       ├── useGroupPendingMessages.ts
│   │       ├── usePendingRequestsQuery.ts
│   │       └── [other conversation-related queries]
│   ├── groups/
│   │   ├── components/
│   │   │   ├── GroupAvatar.tsx
│   │   │   ├── GroupPendingRequestsTable.tsx
│   │   │   ├── GroupScreenAddition.tsx
│   │   │   ├── GroupScreenConsentTable.tsx
│   │   │   ├── GroupScreenDescription.tsx
│   │   │   ├── GroupScreenImage.tsx
│   │   │   ├── GroupScreenMembersTable.tsx
│   │   │   ├── GroupScreenName.tsx
│   │   │   └── GroupConversationItem.tsx
│   │   ├── screens/
│   │   │   ├── Group.tsx
│   │   │   ├── GroupInvite.tsx
│   │   │   └── GroupLink.tsx
│   │   ├── navigation/
│   │   │   ├── GroupNav.tsx
│   │   │   ├── GroupInviteNav.tsx
│   │   │   └── GroupLinkNav.tsx
│   │   ├── hooks/
│   │   │   ├── useExistingGroupInviteLink.ts
│   │   │   ├── useGroupConsent.ts
│   │   │   ├── useGroupCreator.ts
│   │   │   ├── useGroupDescription.ts
│   │   │   ├── useGroupId.ts
│   │   │   ├── useGroupMembers.ts
│   │   │   ├── useGroupName.ts
│   │   │   ├── useGroupPendingRequests.ts
│   │   │   ├── useGroupPermissions.ts
│   │   │   ├── useGroupPhoto.ts
│   │   │   └── useGroupHooks.ts
│   │   ├── utils/
│   │   │   ├── groupUtils/
│   │   │   │   ├── adminUtils.ts
│   │   │   │   ├── getGroupMemberActions.ts
│   │   │   │   ├── groupActionHandlers.ts
│   │   │   │   ├── groupId.ts
│   │   │   │   ├── memberCanUpdateGroup.ts
│   │   │   │   └── sortGroupMembersByAdminStatus.ts
│   │   │   └── groupInvites.ts
│   │   ├── data/
│   │   │   ├── store/
│   │   │   │   ├── profilesStore.ts
│   │   │   │   └── settingsStore.ts
│   │   │   └── db/
│   │   │       └── entities/
│   │   └── queries/
│   │       ├── useAddToGroupMutation.ts
│   │       ├── useAllowGroupMutation.ts
│   │       ├── useBlockGroupMutation.ts
│   │       ├── useCreateGroupJoinRequestMutation.ts
│   │       ├── useGroupConsentQuery.ts
│   │       ├── useGroupDescriptionMutation.ts
│   │       ├── useGroupDescriptionQuery.ts
│   │       ├── useGroupFirstMessageQuery.ts
│   │       ├── useGroupInviteQuery.ts
│   │       ├── useGroupIsActive.ts
│   │       ├── useGroupJoinRequestQuery.ts
│   │       ├── useGroupMembersQuery.ts
│   │       ├── useGroupNameMutation.ts
│   │       ├── useGroupNameQuery.ts
│   │       ├── useGroupPermissionsQuery.ts
│   │       ├── useGroupPhotoMutation.ts
│   │       ├── useGroupPhotoQuery.ts
│   │       ├── useGroupPinnedFrameQuery.ts
│   │       ├── useGroupQuery.ts
│   │       ├── useGroupsQuery.ts
│   │       ├── usePromoteToAdminMutation.ts
│   │       ├── usePromoteToSuperAdminMutation.ts
│   │       ├── useRemoveFromGroupMutation.ts
│   │       ├── useRevokeAdminMutation.ts
│   │       └── useRevokeSuperAdminMutation.ts
│   ├── transactions/
│   │   ├── components/
│   │   │   └── Chat/
│   │   │       └── Transaction/
│   │   ├── screens/
│   │   │   ├── EnableTransactions.tsx
│   │   │   └── TopUp.tsx
│   │   ├── navigation/
│   │   │   ├── EnableTransactionsNav.tsx
│   │   │   └── TopUpNav.tsx
│   │   ├── hooks/
│   │   │   └── useTransactionHooks.ts
│   │   ├── utils/
│   │   │   ├── transaction.ts
│   │   │   └── thirdweb.ts
│   │   └── data/
│   │       └── store/
│   │           └── transactionsStore.ts
│   ├── profiles/
│   │   ├── components/
│   │   │   ├── Avatar.tsx
│   │   │   └── UserProfile.tsx
│   │   ├── screens/
│   │   │   ├── Profile.tsx
│   │   │   ├── ShareProfile.tsx
│   │   │   └── UserProfile.tsx
│   │   ├── navigation/
│   │   │   ├── ProfileNav.tsx
│   │   │   ├── ShareProfileNav.tsx
│   │   │   └── UserProfileNav.tsx
│   │   ├── hooks/
│   │   │   ├── usePhotoSelect.ts
│   │   │   └── useProfileHooks.ts
│   │   ├── utils/
│   │   │   ├── profile.ts
│   │   │   ├── share.ts
│   │   │   ├── share.web.ts
│   │   │   └── profileHelpers.ts
│   │   ├── data/
│   │   │   ├── store/
│   │   │   │   ├── profilesStore.ts
│   │   │   │   └── appStore.ts
│   │   │   └── db/
│   │   │       └── entities/
│   │   └── queries/
│   │       └── [profile-related queries]
│   ├── search/
│   │   ├── components/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── ProfileSearchItem.tsx
│   │   │   └── NoResult.tsx
│   │   ├── screens/
│   │   │   └── ProfileSearch.tsx
│   │   ├── navigation/
│   │   │   └── SearchNav.tsx
│   │   ├── hooks/
│   │   │   └── useSearchHooks.ts
│   │   ├── utils/
│   │   │   ├── search.ts
│   │   │   └── lens.ts
│   │   └── data/
│   │       └── store/
│   │           └── searchStore.ts
│   ├── notifications/
│   │   ├── screens/
│   │   │   └── NotificationsScreen.tsx
│   │   ├── hooks/
│   │   │   ├── useNotificationsHooks.ts
│   │   │   └── useNotificationsState.ts
│   │   └── utils/
│   │       ├── notifications.ts
│   │       └── notifications.web.ts
│   ├── frames/
│   │   ├── components/
│   │   │   └── Frame/
│   │   ├── navigation/
│   │   │   └── ShareFrameNav.tsx
│   │   ├── hooks/
│   │   │   └── useFrameHooks.ts
│   │   ├── utils/
│   │   │   └── frames.ts
│   │   └── data/
│   │       └── store/
│   │           └── framesStore.ts
│   ├── settings/
│   │   ├── components/
│   │   │   ├── DebugButton.tsx
│   │   │   ├── ErroredHeader.tsx
│   │   │   ├── Splash/
│   │   │   │   ├── Splash.android.tsx
│   │   │   │   └── Splash.tsx
│   │   │   └── ErrorHandling/
│   │   │       └── useShouldShowErrored.ts
│   │   ├── hooks/
│   │   │   └── useSettingsHooks.ts
│   │   └── data/
│   │       └── store/
│   │           └── settingsStore.ts
│   ├── matchmaker/
│   │   ├── screens/
│   │   │   └── ConverseMatchMaker.tsx
│   │   ├── navigation/
│   │   │   └── ConverseMatchMakerNav.tsx
│   │   ├── hooks/
│   │   │   └── useMatchMakerHooks.ts
│   │   └── utils/
│   │       └── matchMaker.ts
│   └── [Other Features as necessary]
├── shared/
│   ├── components/
│   │   ├── ActivityIndicator/
│   │   ├── AnimatedBlurView.tsx
│   │   ├── AndroidBackAction.tsx
│   │   ├── Avatar.tsx
│   │   ├── Banner/
│   │   ├── Button/
│   │   ├── ClickableText.tsx
│   │   ├── Drawer.tsx
│   │   ├── EmojiPicker/
│   │   ├── Indicator.tsx
│   │   ├── InitialLoad.tsx
│   │   ├── Picto/
│   │   ├── StateHandlers/
│   │   ├── SvgImageUri.tsx
│   │   ├── TableView/
│   │   ├── Title.tsx
│   │   ├── TouchableOpacity.tsx
│   │   ├── VStack.tsx
│   │   ├── HStack.tsx
│   │   └── [Other shared components]
│   ├── hooks/
│   │   ├── useEventTargetShim.ts
│   │   ├── useShouldShowErrored.ts
│   │   └── [Other shared hooks]
│   ├── utils/
│   │   ├── alert.ts
│   │   ├── analytics.ts
│   │   ├── api.ts
│   │   ├── appState.ts
│   │   ├── array.ts
│   │   ├── attachment/
│   │   ├── background.tsx
│   │   ├── cache/
│   │   ├── contextMenu/
│   │   ├── date.ts
│   │   ├── debug.ts
│   │   ├── device.ts
│   │   ├── emojis/
│   │   ├── ethos.ts
│   │   ├── events.ts
│   │   ├── fileSystem/
│   │   ├── haptics.ts
│   │   ├── keyboard.ts
│   │   ├── logger.ts
│   │   ├── map.ts
│   │   ├── media.ts
│   │   ├── message.ts
│   │   ├── messageContent.ts
│   │   ├── mmkv.ts
│   │   ├── navigation.ts
│   │   ├── objects.ts
│   │   ├── perf/
│   │   ├── reactions.ts
│   │   ├── recommendations.ts
│   │   ├── regex.ts
│   │   ├── retryWithBackoff.ts
│   │   ├── sentry.ts
│   │   ├── set.ts
│   │   ├── sharedData.tsx
│   │   ├── str.ts
│   │   ├── uns.ts
│   │   ├── wait.ts
│   │   └── [Other shared utilities]
│   ├── styles/
│   │   ├── colors/
│   │   ├── sizes/
│   │   ├── border-radius.ts
│   │   ├── borders.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   ├── animations.ts
│   │   └── timing.ts
│   ├── types/
│   │   ├── images.d.ts
│   │   └── react-native.d.ts
│   └── design-system/
│       ├── Text/
│       └── [Other design system components]
├── assets/
│   ├── Encrypted.tsx
│   ├── adaptive-icon.png
│   ├── baseUSDCOnly-dark.png
│   ├── baseUSDCOnly-light.png
│   ├── checkmark.svg
│   ├── clock.svg
│   ├── ellipse.svg
│   ├── encrypted.svg
│   ├── exclamationmark.triangle.svg
│   ├── favicon.png
│   ├── frameLink.svg
│   ├── icon-android/
│   ├── icon-loading.png
│   ├── icon-preview.png
│   ├── icon.png
│   ├── message-bubble.svg
│   ├── message-tail.svg
│   ├── reply.svg
│   ├── send-button-dark.svg
│   ├── send-button-higher.svg
│   ├── send-button-light.svg
│   ├── send-button.svg
│   ├── splash-dark.png
│   ├── splash.png
│   └── web.css
├── config/
│   ├── app.config.ts
│   ├── config.ts
│   └── [Other configuration files]
├── adr/
│   ├── adr.000.readme.md
│   ├── adr.001.folder structure/
│   │   ├── adr.001.folder structure.md
│   │   ├── current folder structure October 16, 2024.md
│   │   ├── current folder structure October 16, 2024.txt
│   │   └── proposed folder structure October 16, 2024.md
│   └── adr.001.architecture-poc-for-business-logic-and-dependencies-group-joining.md
├── scripts/
│   ├── build/
│   ├── migrations/
│   ├── vercelBuild.sh
│   ├── wasm.js
│   └── [Other scripts]
├── public/
│   └── wasm/
│       └── user_preferences_bindings_wasm_bg.wasm
├── queries/
│   ├── MutationKeys.ts
│   ├── QueryKeys.ts
│   ├── [Other query-related files]
├── android/
│   └── [Android-specific files and folders]
├── ios/
│   └── [iOS-specific files and folders]
├── patches/
│   └── [Patch files]
├── vendor/
│   └── humanhash.js
├── i18n/
│   ├── i18n.ts
│   ├── index.ts
│   ├── translate.ts
│   └── translations/
│       └── en.ts
├── App.tsx
├── App.web.tsx
├── index.js
├── polyfills.ts
├── polyfills.web.ts
├── tsconfig.json
├── package.json
└── [Other root-level configuration files]
```

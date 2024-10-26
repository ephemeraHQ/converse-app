export const en = {
  // Onboarding
  walletSelector: {
    title: "Your messages.\nYour privacy.",
    subtitle:
      "Decentralized messaging,\nend-to-end encrypted and owned by you.",
    converseAccount: {
      title: "CONVERSE ACCOUNTS",
      connectViaPhone: "Connect via Phone",
      createEphemeral: "Create Ephemeral Account",
    },
    installedApps: {
      title: "INSTALLED APPS",
      connectWallet: "Connect {{walletName}}",
    },
    connectionOptions: {
      title: "CONNECTION OPTIONS",
      otherOptions: "OTHER OPTIONS",
      connectExistingWallet: "CONNECT EXISTING WALLET",
      connectForDevs: "FOR DEVS",
      connectViaBrowserWallet: "Connect via browser wallet",
      connectViaDesktop: "Connect via desktop",
      connectViaKey: "Connect via Key",
    },
    popularMobileApps: {
      title: "POPULAR MOBILE APPS",
    },
    backButton: "Back",
  },
  privyConnect: {
    title: {
      enterPhone: "Connect via\nphone number",
      verifyPhone: "Confirmation code",
    },
    storedSecurely:
      "Your phone number is stored securely and only shared with Privy so you can log back in.",
    buttons: {
      continue: "Continue",
      back: "Back",
      resendCode: "Resend code",
    },
    phoneInput: {
      placeholder: "Enter your phone number",
    },
    otpInput: {
      enterCode: "Enter the confirmation code sent to",
    },
    errors: {
      invalidPhoneNumber: "Please enter a valid phone number",
      invalidCode: "The code you entered is not valid, please try again",
    },
    resendCodeIn: "Resend code in {{seconds}} seconds...",
  },
  createEphemeral: {
    title: "Create an ephemeral account",
    subtitle:
      "Create conversations and connections without sharing your identity, and stay connected without sharing personal data.",
    disconnect_to_remove:
      "When you disconnect this account, you'll permanently remove its data from your device.",
    createButton: "Create",
    backButton: "Back",
  },
  privateKeyConnect: {
    title: "Connect via key",
    subtitle:
      "Enter the private key for the address you are connecting.\n\nYour private key is not stored.",
    storage: {
      ios: "your iPhone's Secure Enclave",
      android: "the Android Keystore system",
    },
    connectButton: "Connect",
    backButton: "Back",
    privateKeyPlaceholder: "Enter a private key",
    invalidPrivateKey: "This private key is invalid. Please try again",
  },
  connectViaWallet: {
    sign: "Sign",
    firstSignature: {
      title: "Get started",
      explanation:
        "The secure inbox you own.\nConverse is built on XMTP, an open-source secure messaging protocol.",
    },
    secondSignature: {
      title: "Allow Converse",
      explanation:
        "Converse needs your permission\nto send and receive messages.\nYou can revoke this anytime.",
    },
    valueProps: {
      e2eEncryption: {
        title: "End-to-end encrypted with MLS",
        subtitle:
          "IETF-standard cryptography that brings Signal-level security to every conversation.",
      },
      ownCommunications: {
        title: "Own your communications — forever",
        subtitle:
          "Your messages are yours. You own and control them completely, not the app.",
      },
      chatSecurely: {
        title: "Invite your friends",
        subtitle:
          "Find people you know onchain or share your private QR code with your friends.",
      },
    },
    cancel: "Cancel",
    backButton: "Back",
    alreadyConnected: {
      title: "Already connected",
      message: "This account is already connected to Converse.",
    },
  },
  userProfile: {
    title: {
      profile: "Profile",
    },
    buttons: {
      continue: "Continue",
      logout: "Logout from {{address}}",
      cancel: "Cancel",
      addProfilePicture: "Add profile picture",
      changeProfilePicture: "Change profile picture",
    },
    inputs: {
      username: {
        placeholder: "Username",
      },
      usernameSuffix: ".converse.xyz",
      displayName: {
        placeholder: "Display name (optional)",
      },
    },
    errors: {
      displayNameLength:
        "Display names must be between 2 and 32 characters and can't include domain name extensions",
      usernameAlphanumeric:
        "Your username can only contain letters and numbers",
      usernameLength: "Your user name must be between 3 and 30 characters long",
    },
    converseProfiles:
      "Claim your identity in the Converse ENS namespace. This name will be publicly discoverable.",
    instructions:
      "Claim your identity in the Converse ENS namespace. This name will be publicly discoverable.",
    loadingSentences: {
      claimingIdentity: "Claiming your identity",
      connectingENS: "Connecting to ENS",
      confirmingAvailability: "Confirming availability",
      enablingCCIP: "Enabling CCIP",
      registering: "Registering",
      configuringResolver: "Configuring offchain resolver",
      wrappingUp: "Wrapping up",
    },
    mediaOptions: {
      takePhoto: "Take photo",
      chooseFromLibrary: "Choose from library",
      cancel: "Cancel",
    },
  },
  onboarding_error: "An error occurred while logging you in. Please try again.",
  termsText: "By signing in you agree to our",
  termsLink: "terms and conditions.",

  // Conversation List
  delete: "Delete",
  delete_chat_with: "Delete chat with",
  delete_and_block: "Delete and block",
  remove: "Remove",
  remove_and_block_inviter: "Remove and block inviter",
  restore: "Restore",
  restore_and_unblock_inviter: "Restore and unblock inviter",
  unblock_and_restore: "Unblock and restore",
  cancel: "Cancel",
  back: "Back",
  view_only: "View only",
  view_and_restore: "View and Restore",
  view_removed_group_chat: "View removed group chat?",
  connecting: "Connecting…",
  syncing: "Syncing…",
  search_chats: "Search chats",

  // Requests
  requests: "Requests",
  clear_all: "Clear all",
  clear_confirm:
    "Do you confirm? This will block all accounts that are currently tagged as requests.",
  clearing: "Clearing",
  you_might_know: "You might know",
  hidden_requests: "Hidden requests",
  suggestion_text:
    "Based on your onchain history, we've made some suggestions on who you may know.",
  no_suggestions_text:
    "You currently have no message requests. We'll make suggestions here as you connect with others.",
  hidden_requests_warn:
    "Requests containing messages that may be offensive or unwanted are moved to this folder.",

  // Conversation
  accept: "Accept",
  block: "Block",
  decline: "Decline",
  unblock: "Unblock",
  if_you_unblock_contact:
    "If you unblock this contact, they will be able to send you messages again.",
  if_you_block_contact:
    "If you block this contact, you will not receive messages from them anymore",
  opening_conversation: "Opening your conversation",
  conversation_not_found:
    "We couldn't find this conversation. Please try again",
  group_not_found:
    "We couldn't find this group. Please try again or ask someone to invite you to this group",
  say_hi: "Say hi",
  do_you_trust_this_contact: "Do you trust this contact?",
  do_you_want_to_join_this_group: "Do you want to join this group?",
  join_this_group: "Join this group",
  identity_not_found_title: "Identity not found",
  identity_not_found:
    "Identity {{identity}} not found or invalid. Please check it and try again",
  identity_not_found_timeout:
    "Identity {{identity}} took too long to resolve. Please check your connection and try again",
  identity_not_yet_xmtp_title: "Not yet using XMTP",
  identity_not_yet_xmtp:
    "{{identity}} is not yet using XMTP. Tell them to download the app at converse.xyz and log in with their wallet",

  // Conversation Context Menu
  pin: "Pin",
  mark_as_read: "Mark as read",
  mark_as_unread: "Mark as unread",

  // NewGroupSummary
  group_name: "GROUP NAME",
  group_description: "GROUP DESCRIPTION",
  upload_group_photo_error: "Error uploading group photo",
  promote_to_admin_to_manage_group:
    "After creating the group, you can promote anyone to admin to manage members and group info.",

  // Profile
  remove_from_group: "Remove from group",
  are_you_sure: "Are you sure?",
  promote_to_admin: "Promote to admin",
  send_a_message: "Send a message",
  client_error: "Looks like something went wrong, please try reconnecting.",
  actions: "ACTIONS",
  common_activity: "COMMON ACTIVITY",
  social: "SOCIAL",
  address: "ADDRESS",
  youre_the_og: "YOU'RE THE OG",
  app_version: "APP VERSION",
  security: "SECURITY",
  xmtp_wrong_signer: "Wrong wallet",
  xmtp_wrong_signer_description:
    "Linked wallet does not own that XMTP identity. We unlinked it, please try again.",

  // Context Menu
  reply: "Reply",
  copy: "Copy",
  share: "Share",

  // Attachments
  photo_library: "Photo Library",
  camera: "Camera",

  disconnect: "Disconnect",
  disconnect_delete_local_data: "Disconnect and delete local data",
  disconnect_this_account: "Disconnect this account",
  disconnect_account_description:
    "Your group chats will be encrypted and saved on your device until you delete Converse. Your DMs will be backed up by the XMTP network.",
  your_profile_page: "Your profile page",
  copy_wallet_address: "Copy wallet address",
  turn_on_notifications: "Turn on notifications",
  attachment_message_error_download: "Couldn't download attachment",
  attachment_message_view_in_browser: "View in browser",
  attachment: "Attachment",

  // Reactions
  reacted_to_media: "Reacted {{reactionContent}} to a media",
  reacted_to_transaction: "Reacted {{reactionContent}} to a transaction",
  reacted_to_other: 'Reacted {{reactionContent}} to "{{content}}"',
  removed_reaction_to_attachment: "Removed the reaction to an attachment",
  removed_reaction_to: 'Removed the reaction to "{{content}}"',

  // Group Invites
  group_admin_approval:
    "A group admin may need to approve your membership prior to joining.",
  joining: "Joining...",
  join_group: "Join group",
  group_join_error: "An error occurred",
  group_join_invite_invalid: "This invite is no longer valid",
  group_finished_polling_unsuccessfully:
    "Your request has been sent. Wait for the admin approve you",
  group_already_joined: "This invite has already been accepted",
  group_invite_default_group_name: "New Group",

  // Group Overview
  change_profile_picture: "Change profile picture",
  add_profile_picture: "Add profile picture",
  add_description: "Add a description",
  restore_group: "Restore group",
  remove_group: "Remove group",
  actions_title: "ACTIONS",
  members_title: "MEMBERS",
  membership_requests_title: "MEMBERSHIP REQUESTS",
  group_invite_link_created_copied: "Invite link created and copied!",
  group_invite_link_copied: "Invite link copied!",
  group_invite_link_deleted: "Invite link deleted!",
  add_more_members: "Add more members",
  copy_invite_link: "Copy invite link",
  create_invite_link: "Create invite link",
  pending: "Pending",
  approve: "Approve",
  deny: "Deny",
  approve_member_to_this_group: "Approve {{name}} to this group",

  // Wallet selector
  no_wallet_detected: "No wallet detected",

  // Profile
  view_removed_chats: "View removed chats",
  change_or_add_account: "Change or add account",

  // Revocation
  current_installation_revoked: "Logged out",
  current_installation_revoked_description:
    "You have been logged out of your account. Your group chats will be deleted from this device.",
  other_installations_count: "You have {{count}} active logins",
  revoke_description: "Would you like to log out from all other sessions?",
  revoke_done_title: "Done",
  revoke_done_description: "Logged out of {{count}} sessions",
  revoke_empty: "You have no other active sessions",
  revoke_others_cta: "Log out others",
  revoke_wallet_picker_title: "Log out others",
  revoke_wallet_picker_description:
    "Connect the wallet associated with your XMTP account: {{wallet}}",

  // Emoji Picker
  search_emojis: "Search emojis",

  // Chat null state
  connectWithYourNetwork: "Find your frens",
  shareYourQRCode: "Share your QR code",
  moveOrConnect:
    "Move a conversation to Converse,\nor connect with someone new.",
  findContacts:
    "Here are some recommended contacts based on\nyour onchain activity",
  copyShareLink: "Copy Share Link",
  alphaTestTitle: "Help shape the future of Converse!",
  alphaTestDescription:
    "Share your feedback and ideas with the Converse team and other alpha testers.",
  joinAlphaGroup: "Join Converse VIP Alpha Chat",
  linkCopied: "Link copied",

  // Transactional frames
  transactionalFrameConnectWallet:
    "Connect to a wallet app to trigger a transaction",
  transaction_failure: "Transaction failed",
  transaction_pending: "Confirm in {{wallet}}",
  transaction_triggering: "Opening {{wallet}}...",
  transaction_triggered: "Your transaction is being executed...",
  transaction_success: "Done!",
  transaction_switch_chain: "Switch Chain to {{chainName}} in {{wallet}}",
  transaction_wallet: "Wallet",

  // Transaction Simulation
  simulation_pending: "Safely Simulating this Transaction",
  simulation_failure:
    "We were unable to simulate this transaction. You may still trigger it in your wallet.",
  simulation_will_revert:
    "Simulation shows that this transaction will revert. You may still try to trigger it in your wallet.",
  simulation_caution: "Caution",
  transaction_asset_change_type_approve: "Approve",
  transaction_asset_change_type_transfer: "Transfer",
  transaction_asset_change_to: "To",
  external_wallet_chain_not_supported:
    "This chain is not supported by your wallet",

  // New Conversation
  cannot_be_added_to_group_yet:
    "{{name}} needs to update Converse to be added to a group",

  // Group Updated Message
  group_name_changed: '{{name}} changed the group name to "{{newValue}}".',
  group_member_joined: "{{name}} joined the conversation",
  group_member_left: "{{name}} left the conversation",
  group_photo_changed: "{{name}} changed the group photo.",
  group_description_changed:
    '{{name}} changed the group description to "{{newValue}}".',
  group_name_changed_to: '{{name}} changed the group name to "{{newValue}}".',

  message_status: {
    sent: "Sent",
    delivered: "Sent",
    error: "Failed",
    sending: "Sending",
    prepared: "Sending",
    seen: "Read",
  },
};
export type Translations = typeof en;

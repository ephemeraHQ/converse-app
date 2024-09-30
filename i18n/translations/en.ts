const en = {
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
      "Enter the private key for the address you are connecting.\n\nYour private key will only be stored locally in {{storage}}.",
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
  view_only: "View only",
  view_and_restore: "View and Restore",
  view_removed_group_chat: "View removed group chat?",

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
  say_hi: "Say hi",
  do_you_trust_this_contact: "Do you trust this contact?",
  do_you_want_to_join_this_group: "Do you want to join this group?",
  join_this_group: "Join this group",

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
  "A group admin may need to approve your membership prior to joining.":
    "A group admin may need to approve your membership prior to joining.",
  joining: "Joining...",
  "Joining...": "Joining...",
  join_group: "Join group",
  "Join group": "Join group",
  group_join_error: "An error occurred",
  "An error occurred": "An error occurred",
  group_join_invite_invalid: "This invite is no longer valid",
  "This invite is no longer valid": "This invite is no longer valid",
  group_finished_polling_unsuccessfully: "This is taking longer than expected",
  "This is taking longer than expected": "This is taking longer than expected",
  group_already_joined: "This invite has already been accepted",
  "This invite has already been accepted":
    "This invite has already been accepted",
  group_invite_default_group_name: "New Group",
  "New Group": "New Group",

  // Group Overview
  change_profile_picture: "Change profile picture",
  add_profile_picture: "Add profile picture",
  add_description: "Add a description",
  restore_group: "Restore group",
  remove_group: "Remove group",
  actions_title: "ACTIONS",
  members_title: "MEMBERS",
  pending_approval_title: "PENDING APPROVAL",
  group_invite_link_created_copied: "Invite link created and copied!",
  group_invite_link_copied: "Invite link copied!",
  group_invite_link_deleted: "Invite link deleted!",
  "Add more members": "Add more members",
  copy_invite_link: "Copy invite link",
  create_invite_link: "Create invite link",
  pending: "Pending",
  approve: "Approve",
  deny: "Deny",
  approve_member_to_this_group: "Approve {{name}} to this group",

  // Revocation
  current_installation_revoked: "Installation revoked",
  current_installation_revoked_description:
    "The current installation has been revoked, you will now get logged out and group chats will be deleted",
  other_installations_count: "You have {{count}} other installations",
  temporary_revoke_description: "Can we revoke those installations now?",

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
};

export default en;
export type Translations = typeof en;

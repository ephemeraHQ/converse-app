const en = {
  // Onboarding
  sign: "Sign",
  first_signature_explanation:
    "This first signature will create your identity on the XMTP Network.\n\n",
  second_signature_explanation:
    "This signature will enable your identity on the XMTP Network.\n\n",
  sign_access:
    "Please sign one last time to access Converse and start chatting.",
  onboarding_error: "An error occurred while logging you in. Please try again.",

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

  // Conversation
  accept: "Accept",
  block: "Block",
  decline: "Decline",
  unblock: "Unblock",
  if_you_unblock_contact:
    "If you unblock this contact, they will be able to send you messages again.",
  if_you_block_contact:
    "If you block this contact, you will not receive messages from them anymore",
  if_you_unblock_group:
    "If you unblock this group, you will be able to receive messages from it.",
  opening_conversation: "Opening your conversation",
  say_hi: "Say hi",
  do_you_trust_this_contact: "Do you trust this contact?",
  do_you_want_to_join_this_group: "Do you want to join this group?",
  join_this_group: "Join this group",

  // NewGroupSummary
  group_name: "GROUP NAME",
  group_description: "GROUP DESCRIPTION",
  upload_group_photo_error: "Error uploading group photo",

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
  attachment_message_error_download: "Couldn’t download attachment",
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
  group_finished_polling: "This is taking longer than expected",

  // Group Overview
  change_profile_picture: "Change profile picture",
  add_profile_picture: "Add profile picture",
  add_description: "Add a description",
  allow_group: "Allow group",
  block_group: "Block group",
  consent_title: "CONSENT",
  members_title: "MEMBERS",
  pending_approval_title: "PENDING APPROVAL",
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

  // Revocation
  current_installation_revoked: "Installation revoked",
  current_installation_revoked_description:
    "The current installation has been revoked, you will now get logged out and group chats will be deleted",
  other_installations_count: "You have {{count}} other installations",
  temporary_revoke_description: "Can we revoke those installations now?",

  // Emoji Picker
  search_emojis: "Search emojis",
};

export default en;
export type Translations = typeof en;

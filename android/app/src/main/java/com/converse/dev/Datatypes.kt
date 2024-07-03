package com.converse.dev

import kotlin.math.roundToInt

class NotificationData(val message: String, val timestampNs: String, val contentTopic: String, val account: String)
class ConversationDictData(val shortAddress: String? = null, val title: String? = null)
class SavedNotificationMessage(val topic: String, val content: String, val senderAddress: String, val sent: Long, val id: String, val contentType: String, val account: String? = null, val referencedMessageId: String? = null)
class ConversationContext(val conversationId: String, val metadata: Map<String, Any>)
class Accounts(val currentAccount: String, val accounts: Array<String>, val databaseId: Map<String, String>? = null)
class AccountsStore(val state: Accounts, val version: Int)
class EnsName(val name: String, val displayName: String? = null, val isPrimary: Boolean? = false)
class ConverseUserName(val name: String, val displayName: String? = null, val isPrimary: Boolean? = false)
class ProfileSocials(val ensNames: Array<EnsName>? = null, val userNames: Array<ConverseUserName>? = null)
class Profile(val updatedAt: Long, val socials: ProfileSocials)
class Profiles(val profiles: Map<String, Profile>? = null)
class ProfilesStore(val state: Profiles, val version: Int)
class SavedNotificationConversation(val topic: String, val peerAddress: String, val createdAt: Long, val context: ConversationContext?, val account: String? = null, spamScore: Double?) {
  // Whenever spamScore is set, round it to two decimal to ensure it fits as a 2-digit float in the database
  var spamScore: Double? = spamScore
    set(value) {
      field = value?.let { (it * 100).roundToInt().toDouble() / 100 }
    }
}
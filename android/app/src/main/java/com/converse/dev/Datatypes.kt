package com.converse.dev

import kotlin.math.roundToInt

class NotificationData(val message: String, val timestampNs: String, val contentTopic: String, val sentViaConverse: Boolean? = false, val account: String)
class ConversationDictData(val shortAddress: String? = null, val title: String? = null)
class SavedNotificationMessage(val topic: String, val content: String, val senderAddress: String, val sent: Long, val id: String, val sentViaConverse: Boolean, val contentType: String, val account: String? = null)
class ConversationContext(val conversationId: String, val metadata: Map<String, Any>)
class Accounts(val currentAccount: String, val accounts: Array<String>, val databaseId: Map<String, String>? = null)
class AccountsStore(val state: Accounts, val version: Int)
class SavedNotificationConversation(val topic: String, val peerAddress: String, val createdAt: Long, val context: ConversationContext?, val account: String? = null, spamScore: Double? = null) {
  // Whenever spamScore is set, round it to two decimal to ensure it fits as a 2-digit float in the database
  var spamScore: Double? = null
    set(value) {
      field = value?.let { (it * 100).roundToInt().toDouble() / 100 }
    }
}
package com.converse.dev

class NotificationData(val message: String, val timestampNs: String, val contentTopic: String, val sentViaConverse: Boolean? = false, val account: String? = null, val newConversationTopic: String? = null)
class ConversationDictData(val shortAddress: String? = null, val lensHandle: String? = null, val ensName: String? = null, val title: String? = null)
class SavedNotificationMessage(val topic: String, val content: String, val senderAddress: String, val sent: Long, val id: String, val sentViaConverse: Boolean, val contentType: String, val account: String? = null)
class ConversationContext(val conversationId: String, val metadata: Map<String, Any>)
class ConversationV2Data(val version: String = "v2", val topic: String, val peerAddress: String, val createdAt: String, val context: ConversationContext?, val keyMaterial: String)
class SavedNotificationConversation(val topic: String, val peerAddress: String, val createdAt: Long, val context: ConversationContext?, val account: String? = null)
class Accounts(val currentAccount: String, val accounts: Array<String>, val databaseId: Map<String, String>)
class AccountsStore(val state: Accounts, val version: Int)
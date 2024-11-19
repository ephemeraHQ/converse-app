import org.xmtp.android.library.ConsentList
import org.xmtp.android.library.ConsentState
import org.xmtp.android.library.Conversation

suspend fun isConversationBlocked(conversation: Conversation, consentList: ConsentList): Boolean {
    return isConversationIdBlocked(conversation.id, consentList)
}

suspend fun isConversationAllowed(conversation: Conversation, consentList: ConsentList): Boolean {
    return isConversationIdAllowed(conversation.id, consentList)
}

suspend fun isConversationIdBlocked(conversationId: String, consentList: ConsentList): Boolean {
    return consentList.conversationState(conversationId) == ConsentState.DENIED
}

suspend fun isConversationIdAllowed(conversationId: String, consentList: ConsentList): Boolean {
    return consentList.conversationState(conversationId) == ConsentState.ALLOWED
}

suspend fun isAddressAllowed(address: String, consentList: ConsentList): Boolean {
    return consentList.addressState(address) == ConsentState.ALLOWED
}

suspend fun isAddressBlocked(address: String, consentList: ConsentList): Boolean {
    return consentList.addressState(address) == ConsentState.DENIED
}

suspend fun isInboxIdAllowed(inboxId: String, consentList: ConsentList): Boolean {
    return consentList.inboxIdState(inboxId) == ConsentState.ALLOWED
}

suspend fun isInboxIdBlocked(inboxId: String, consentList: ConsentList): Boolean {
    return consentList.inboxIdState(inboxId) == ConsentState.DENIED
}

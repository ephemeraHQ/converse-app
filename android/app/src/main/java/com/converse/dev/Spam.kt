import android.content.Context
import android.util.Log
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.converse.dev.containsURL
import com.converse.dev.getAsyncStorage
import com.converse.dev.getMmkv
import com.converse.dev.xmtp.getContentTypeString
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import org.json.JSONObject
import org.xmtp.android.library.Client
import org.xmtp.android.library.DecodedMessage
import org.xmtp.android.library.Group
import java.util.HashMap
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import org.web3j.crypto.Keys

val restrictedWords = listOf(
    "Coinbase",
    "Airdrop",
    "voucher",
    "offer",
    "restriction",
    "Congrats",
    "\$SHIB",
    "\$AERO"
)

fun containsRestrictedWords(searchString: String): Boolean {
    // Convert the search string to lowercase
    val lowercasedSearchString = searchString.lowercase()

    // Check each restricted word in the lowercase search string
    for (word in restrictedWords) {
        if (lowercasedSearchString.contains(word.lowercase())) {
            return true
        }
    }
    return false
}

fun getMessageSpamScore(message: String?, contentType: String): Int {
    var spamScore = 0
    if (contentType.startsWith("xmtp.org/text:") && message?.let { containsURL(it) } == true) {
        spamScore += 1
    }
    if (message !== null && containsRestrictedWords(message)) {
        spamScore += 1
    }
    return spamScore
}

fun computeSpamScore(address: String, message: String?, contentType: String, apiURI: String?, appContext: Context): Double {
    var senderScore = runBlocking {
        getSenderSpamScore(appContext, address, apiURI);
    }
    return senderScore + getMessageSpamScore(message, contentType)
}

suspend fun computeSpamScoreGroupMessage(client: Client, group: Group, decodedMessage: DecodedMessage, apiURI: String?): Int {
    val senderSpamScore = 0
    try {
        client.contacts.refreshConsentList()
        val groupDenied = client.contacts.isGroupDenied(group.id)
        if (groupDenied) {
            // Network consent will override other checks
            return 1
        }

        val senderInboxId = decodedMessage.senderAddress
        val senderDenied = client.contacts.isInboxDenied(senderInboxId)
        if (senderDenied) {
            // Network consent will override other checks
            return 1
        }

        val senderAllowed = client.contacts.isInboxAllowed(senderInboxId)
        if (senderAllowed) {
            // Network consent will override other checks
            return -1
        }

        val groupAllowed = client.contacts.isGroupAllowed(group.id)
        if (groupAllowed) {
            // Network consent will override other checks
            return -1
        }

        val senderAddresses = group.members().find { it.inboxId == senderInboxId }?.addresses
        if (senderAddresses != null) {
            for (address in senderAddresses) {
                if (client.contacts.isDenied(Keys.toChecksumAddress(address))) {
                    return 1
                }
            }
            for (address in senderAddresses) {
                if (client.contacts.isAllowed(Keys.toChecksumAddress(address))) {
                    return -1
                }
            }
        }

        // TODO: Handling for inbox Id
        // spamScore = getSenderSpamScore(address: senderInboxId, apiURI: apiURI)

    } catch (e: Exception) {
    }

    val contentType = getContentTypeString(decodedMessage.encodedContent.type)

    var messageContent: String? = null
    if (contentType.startsWith("xmtp.org/text:")) {
        messageContent = decodedMessage.encodedContent.content.toStringUtf8()
    }

    val messageSpamScore = getMessageSpamScore(messageContent, contentType)

    return senderSpamScore + messageSpamScore
}

suspend fun computeSpamScoreGroupWelcome(appContext: Context, client: Client, group: Group, apiURI: String?): Double {
    try {
        client.contacts.refreshConsentList()
        // Probably an unlikely case until consent proofs for groups exist
        val groupAllowed = client.contacts.isGroupAllowed(groupId = group.id)
        if (groupAllowed) {
            return -1.0
        }

        val inviterInboxId = group.addedByInboxId()
        val inviterAllowed = client.contacts.isInboxAllowed(inboxId = inviterInboxId)
        if (inviterAllowed) {
            return -1.0
        }

        val inviterDenied = client.contacts.isInboxDenied(inboxId = inviterInboxId)
        if (inviterDenied) {
            return 1.0
        }
        val members = group.members()

        for (member in members) {
            if (member.inboxId == inviterInboxId) {
                member.addresses?.forEach { address ->
                    val ethereumAddress = Keys.toChecksumAddress(address)
                    if (client.contacts.isDenied(ethereumAddress)) {
                        return 1.0
                    }
                }

                member.addresses?.forEach { address ->
                    val ethereumAddress = Keys.toChecksumAddress(address)
                    if (client.contacts.isAllowed(ethereumAddress)) {
                        return -1.0
                    }
                }

                member.addresses?.firstOrNull()?.let { firstAddress ->
                    val senderSpamScore = getSenderSpamScore(
                        appContext = appContext,
                        address = Keys.toChecksumAddress(firstAddress),
                        apiURI = apiURI
                    )
                    return senderSpamScore
                }
            }
        }


    } catch (e: Exception) {
        return 0.0
    }
    return 0.0
}

suspend fun getSenderSpamScore(appContext: Context, address: String, apiURI: String?): Double {
    val senderSpamScoreURI = "$apiURI/api/spam/senders/batch"
    val params: MutableMap<String?, Any> = HashMap()
    params["sendersAddresses"] = arrayOf(address);

    val parameters = JSONObject(params as Map<*, *>?)

    return suspendCancellableCoroutine { continuation ->
        val jsonRequest = JsonObjectRequest(Request.Method.POST, senderSpamScoreURI, parameters, {
            var result = 0.0;
            if (it.has(address)){
                result = (it[address] as Int).toDouble()
            }
            continuation.resume(result)

        }) { error ->
            error.printStackTrace()
            continuation.resumeWithException(error)
        }

        Volley.newRequestQueue(appContext).add(jsonRequest)
    }

}
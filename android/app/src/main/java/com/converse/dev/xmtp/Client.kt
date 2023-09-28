package com.converse.dev.xmtp

import android.content.Context
import android.util.Log
import com.converse.dev.*
import org.xmtp.android.library.*
import com.google.crypto.tink.subtle.Base64
import org.xmtp.android.library.Client
import org.xmtp.android.library.ClientOptions
import org.xmtp.android.library.XMTPEnvironment
import org.xmtp.android.library.codecs.AttachmentCodec
import org.xmtp.android.library.codecs.ReactionCodec
import org.xmtp.android.library.codecs.RemoteAttachmentCodec
import org.xmtp.android.library.messages.PrivateKeyBundleV1Builder

fun initCodecs() {
    Client.register(codec = AttachmentCodec())
    Client.register(codec = RemoteAttachmentCodec())
    Client.register(codec = ReactionCodec())
}

fun getXmtpAccountForTopic(appContext: Context, topic: String): String? {
    if (isInviteTopic(topic)) {
        // If invite topic, account is part of topic
        return topic.substring(15, topic.length - 6)
    }
    val accounts = getAccounts(appContext)
    var account: String? = null
    var i = 0
    while (account == null && i < accounts.size) {
        val thisAccount = accounts[i]
        if (hasTopic(appContext, thisAccount, topic)) {
            account = thisAccount
        }
        i += 1
    }
   return account
}

fun getXmtpKeyForTopic(appContext: Context, topic: String): ByteArray? {
    val legacyKey = getKeychainValue("XMTP_BASE64_KEY")
    if (legacyKey != null && legacyKey.isNotEmpty()) {
        Log.d("XmtpClient", "Legacy Key Found: ${legacyKey} ${legacyKey.length}")
        return Base64.decode(legacyKey)
    }
    val account = getXmtpAccountForTopic(appContext, topic)

    if (account != null) {
        Log.d("XmtpClient", "Found account for topic: ${account}")
        val accountKey = getKeychainValue("XMTP_KEY_${account}")
        if (accountKey != null && accountKey.isNotEmpty()) {
            Log.d("XmtpClient", "Found key for account: ${account}")
            return Base64.decode(accountKey)
        }
    }
    return null
}
fun getXmtpClient(appContext: Context, topic: String): Client? {
    val keyByteArray = getXmtpKeyForTopic(appContext, topic) ?: return null
    val keys = PrivateKeyBundleV1Builder.buildFromBundle(keyByteArray)
    val mmkv = getMmkv(appContext)
    var xmtpEnvString = mmkv?.decodeString("xmtp-env")
    // TODO => stop using async storage
    if (xmtpEnvString == null) {
        xmtpEnvString = getAsyncStorage("xmtp-env")
    }
    val xmtpEnv =
        if (xmtpEnvString == "production") XMTPEnvironment.PRODUCTION else XMTPEnvironment.DEV

    val options = ClientOptions(api = ClientOptions.Api(env = xmtpEnv, isSecure = true))

    return Client().buildFrom(bundle = keys, options = options)
}
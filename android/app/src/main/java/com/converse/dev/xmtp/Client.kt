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
import org.xmtp.android.library.codecs.ReplyCodec
import org.xmtp.android.library.messages.PrivateKeyBundleV1Builder

fun initCodecs() {
    Client.register(codec = AttachmentCodec())
    Client.register(codec = RemoteAttachmentCodec())
    Client.register(codec = ReactionCodec())
    Client.register(codec = ReplyCodec())
}

fun getXmtpKeyForAccount(appContext: Context, account: String): String? {
    val legacyKey = getKeychainValue("XMTP_BASE64_KEY")
    if (legacyKey != null && legacyKey.isNotEmpty()) {
        Log.d("XmtpClient", "Legacy Key Found: ${legacyKey} ${legacyKey.length}")
        return legacyKey
    }

    val accountKey = getKeychainValue("XMTP_KEY_${account}")
    if (accountKey != null && accountKey.isNotEmpty()) {
        Log.d("XmtpClient", "Found key for account: ${account}")
        return accountKey
    }
    return null
}

fun getDbEncryptionKey(): ByteArray? {
    val key = getKeychainValue("LIBXMTP_DB_ENCRYPTION_KEY")
    if (key != null) {
        return Base64.decode(key, Base64.DEFAULT)
    } else {
        throw Exception("No db encryption key found")
    }
}

suspend fun getXmtpClient(appContext: Context, account: String): Client? {
    val keyString = getXmtpKeyForAccount(appContext, account) ?: return null
    val keyByteArray = Base64.decode(keyString)
    val keys = PrivateKeyBundleV1Builder.buildFromBundle(keyByteArray)
    val mmkv = getMmkv(appContext)
    var xmtpEnvString = mmkv?.decodeString("xmtp-env")
    // TODO => stop using async storage
    if (xmtpEnvString == null) {
        xmtpEnvString = getAsyncStorage("xmtp-env")
    }
    val xmtpEnv =
        if (xmtpEnvString == "production") XMTPEnvironment.PRODUCTION else XMTPEnvironment.DEV

    val dbDirectory = "/data/data/${appContext.packageName}/databases"
    val dbEncryptionKey = getDbEncryptionKey()

    val options = ClientOptions(api = ClientOptions.Api(env = xmtpEnv, isSecure = true), enableV3 = true, dbEncryptionKey = dbEncryptionKey,  dbDirectory = dbDirectory, appContext = appContext)

    return Client().buildFrom(bundle = keys, options = options)
}
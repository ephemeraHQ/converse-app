package com.converse.xmtp

import android.content.Context
import android.util.Log
import com.converse.*
import org.xmtp.android.library.*
import com.google.crypto.tink.subtle.Base64
import org.xmtp.android.library.Client
import org.xmtp.android.library.ClientOptions
import org.xmtp.android.library.XMTPEnvironment
import org.xmtp.android.library.codecs.AttachmentCodec
import org.xmtp.android.library.codecs.ReactionCodec
import org.xmtp.android.library.codecs.RemoteAttachmentCodec
import org.xmtp.android.library.codecs.ReplyCodec

fun initCodecs() {
    Client.register(codec = AttachmentCodec())
    Client.register(codec = RemoteAttachmentCodec())
    Client.register(codec = ReactionCodec())
    Client.register(codec = ReplyCodec())
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
    if (dbEncryptionKey == null) {
        throw Error("Missing dbEncryptionKey")
    }

    val options = ClientOptions(api = ClientOptions.Api(env = xmtpEnv, isSecure = true), dbEncryptionKey = dbEncryptionKey,  dbDirectory = dbDirectory, appContext = appContext)

    return Client().build(address = account, options = options)
}
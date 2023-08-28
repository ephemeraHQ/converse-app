package com.converse.dev.xmtp

import android.util.Log
import org.xmtp.android.library.*
import com.converse.dev.getAsyncStorage
import com.converse.dev.getKeychainValue
import com.google.crypto.tink.subtle.Base64
import org.xmtp.android.library.Client
import org.xmtp.android.library.ClientOptions
import org.xmtp.android.library.XMTPEnvironment
import org.xmtp.android.library.codecs.AttachmentCodec
import org.xmtp.android.library.codecs.ReactionCodec
import org.xmtp.android.library.codecs.RemoteAttachmentCodec
import org.xmtp.android.library.messages.PrivateKeyBundleV1Builder

fun getXmtpClient(): Client {
    Client.register(codec = AttachmentCodec())
    Client.register(codec = RemoteAttachmentCodec())
    Client.register(codec = ReactionCodec())
    val xmtpBase64KeyString = getKeychainValue("XMTP_BASE64_KEY")
    if (xmtpBase64KeyString == null || xmtpBase64KeyString.isEmpty()) {
        Log.d("PushNotificationsService", "No XMTP Base 64 Key found")
    } else {
        Log.d("PushNotificationsService", "Got XMTP Base 64 Key")
    }
    val keys = PrivateKeyBundleV1Builder.buildFromBundle(Base64.decode(xmtpBase64KeyString))
    val xmtpEnvString = getAsyncStorage("xmtp-env")
    val xmtpEnv =
        if (xmtpEnvString == "production") XMTPEnvironment.PRODUCTION else XMTPEnvironment.DEV

    val options = ClientOptions(api = ClientOptions.Api(env = xmtpEnv, isSecure = true))

    return Client().buildFrom(bundle = keys, options = options)
}
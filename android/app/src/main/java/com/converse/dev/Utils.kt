package com.converse.dev

import com.google.crypto.tink.subtle.Base64
import com.google.protobuf.ByteString
import expo.modules.core.Promise

fun byteStringToBase64(bs: ByteString): String {
    return Base64.encode(bs.toByteArray())
}

fun containsURL(input: String): Boolean {
    val pattern = "\\b(?:(?:https?|ftp):\\/\\/|www\\.)?[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(?:\\/\\S*)?(?:\\?\\S*)?\\b"
    val regex = Regex(pattern, RegexOption.IGNORE_CASE)
    val matches = regex.findAll(input).count()
    return matches > 0
}

fun shortAddress(input: String): String {
    if (input.length > 6) {
        val start = 4
        val end = input.lastIndex - 3
        return input.replaceRange(start, end, "...")
    }
    return input
}

internal class PromiseWrapper (private val mPromise: com.facebook.react.bridge.Promise) :
    Promise {
    override fun resolve(value: Any?) {
        mPromise.resolve(value.toString())
    }

    override fun reject(code: String, message: String, e: Throwable) {
        mPromise.reject(code, message, e)
    }
}

fun isInviteTopic(topic: String): Boolean {
    return topic.startsWith("/xmtp/0/invite-")
}

fun isIntroTopic(topic: String): Boolean {
    return topic.startsWith("/xmtp/0/intro-")
}

fun isGroupMessageTopic(topic: String): Boolean {
    return topic.startsWith("/xmtp/mls/1/g-")
}

fun isGroupWelcomeTopic(topic: String): Boolean {
    return topic.startsWith("/xmtp/mls/1/w-")
}

fun getPreferredName(address: String, socials: ProfileSocials): String {
    socials.userNames?.firstOrNull { it.isPrimary ?: false }?.let { primaryUsername ->
        return primaryUsername.displayName ?: primaryUsername.name
    }

    socials.ensNames?.firstOrNull { it.isPrimary ?: false }?.let { primaryEns ->
        return primaryEns.displayName ?: primaryEns.name
    }

    return shortAddress(address)
}

fun getPreferredAvatar(socials: ProfileSocials): String? {
    socials.userNames?.firstOrNull { it.isPrimary ?: false }?.let {
        return it.avatar
    }

    socials.ensNames?.firstOrNull { it.isPrimary ?: false }?.let {
        return it.avatar
    }

    return null
}

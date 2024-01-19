package com.converse.dev


import expo.modules.securestore.SecureStoreModule
import expo.modules.securestore.SecureStoreOptions
import kotlinx.coroutines.runBlocking
import kotlin.reflect.full.callSuspend
import kotlin.reflect.full.memberFunctions
import kotlin.reflect.jvm.isAccessible

suspend fun Any.invokeSuspendFunction(methodName: String, vararg args: Any?): Any? =
    this::class.memberFunctions.find { it.name == methodName }?.also {
        it.isAccessible = true
        return it.callSuspend(this, *args)
    }

fun getKeychainValue(key: String) = runBlocking {
    val options = SecureStoreOptions("", BuildConfig.APPLICATION_ID, false)
    return@runBlocking PushNotificationsService.secureStoreModule.invokeSuspendFunction("getItemImpl", key, options) as String?
}

fun setKeychainValue(key: String, value: String) = runBlocking {
    val options = SecureStoreOptions("", BuildConfig.APPLICATION_ID, false)
    PushNotificationsService.secureStoreModule.invokeSuspendFunction("setItemImpl", key, value, options, false)
}
package com.converse.dev

import com.facebook.react.bridge.PromiseImpl
import expo.modules.core.arguments.MapArguments
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

fun getKeychainValue(key: String) = runBlocking {
    val argumentsMap = mutableMapOf<String, Any>()
    argumentsMap["keychainService"] = BuildConfig.APPLICATION_ID

    val arguments = MapArguments(argumentsMap)

    var promiseResult: Any? = null;

    val promise = PromiseImpl({ result: Array<Any?>? -> promiseResult = result?.get(0) }, { error: Array<Any?>? -> })
    val promiseWrapped = PromiseWrapper(promise)
    withContext(Dispatchers.Default) {
        PushNotificationsService.secureStoreModule.getValueWithKeyAsync(key, arguments, promiseWrapped)
    }
    return@runBlocking promiseResult as String
}

fun setKeychainValue(key: String, value: String) = runBlocking {
    val argumentsMap = mutableMapOf<String, Any>()
    argumentsMap["keychainService"] = BuildConfig.APPLICATION_ID

    val arguments = MapArguments(argumentsMap)

    var promiseResult: Any? = null;

    val promise = PromiseImpl({ result: Array<Any?>? -> promiseResult = result?.get(0) }, { error: Array<Any?>? -> })
    val promiseWrapped = PromiseWrapper(promise)
    withContext(Dispatchers.Default) {
        PushNotificationsService.secureStoreModule.setValueWithKeyAsync(value, key, arguments, promiseWrapped)
    }
    return@runBlocking promiseResult as String
}
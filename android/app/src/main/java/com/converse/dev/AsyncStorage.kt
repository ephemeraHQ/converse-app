package com.converse.dev

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableNativeArray
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.ArrayList
import kotlin.coroutines.resume

fun getAsyncStorage(key: String): String? {
    val storageArguments = Arguments.createArray()
    storageArguments.pushString(key)

    var value = ""

    runBlocking {
        suspendCancellableCoroutine<Unit> { continuation ->
            // Call the suspend function and pass in a lambda that resumes the coroutine when the callback is called
            PushNotificationsService.asyncStorageModule.multiGet(storageArguments) { result ->
                try {
                    value =
                        ((result[1] as WritableNativeArray).toArrayList()[0] as ArrayList<String>)[1]
                    continuation.resume(Unit)
                } catch (e: Exception) {
                    Log.d("PushNotificationsService", "Could not read AsyncStorage value : $e")
                    continuation.resume(Unit)
                }
            }
        }
    }
    return value
}

fun setAsyncStorage(key: String, value: String) {
    val storageArguments = Arguments.createArray()
    val valueArguments = Arguments.createArray()
    valueArguments.pushString(key)
    valueArguments.pushString(value)
    storageArguments.pushArray(valueArguments)
    runBlocking {
        suspendCancellableCoroutine<Unit> { continuation ->
            // Call the suspend function and pass in a lambda that resumes the coroutine when the callback is called
            PushNotificationsService.asyncStorageModule.multiSet(storageArguments) { _ ->
                try {
                    continuation.resume(Unit)
                } catch (e: Exception) {
                    Log.d("PushNotificationsService", "Could not set AsyncStorage value : $e")
                    continuation.resume(Unit)
                }
            }
        }
    }
}

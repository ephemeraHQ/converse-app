package com.converse.dev

import android.content.Context
import android.util.Log
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.beust.klaxon.Klaxon
import kotlinx.coroutines.suspendCancellableCoroutine
import org.web3j.crypto.Keys
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException


suspend fun getProfile(appContext: Context, account: String, address: String): Profile? {

    var profileState = getProfilesStore(appContext, account)?.state
    var lowercasedAddress = address.lowercase()
    var formattedAddress = Keys.toChecksumAddress(address)
    profileState?.profiles?.get(address)?.let { return it }
    profileState?.profiles?.get(formattedAddress)?.let { return it }
    profileState?.profiles?.get(lowercasedAddress)?.let { return it }

    // If profile is nil, let's refresh it
    try {
        refreshProfileFromBackend(appContext, account, formattedAddress)
    } catch (e: Exception) {
        // Handle exception if needed
    }

    profileState = getProfilesStore(appContext, account)?.state

    return profileState?.profiles?.get(formattedAddress)
}

suspend fun refreshProfileFromBackend(appContext: Context, account: String, address: String) {
    val mmkv = getMmkv(appContext)
    var apiURI = mmkv?.decodeString("api-uri")
    if (!apiURI.isNullOrEmpty()) {
        val profileURI = "$apiURI/api/profile?address=$address"

        val response = suspendCancellableCoroutine<ByteArray> { continuation ->
            val request = JsonObjectRequest(
                Request.Method.GET, profileURI, null,
                { response ->
                    continuation.resume(response.toString().toByteArray())
                },
                { error ->
                    // Log the error details
                    val networkResponse = error.networkResponse
                    if (networkResponse != null) {
                        val statusCode = networkResponse.statusCode
                        val data = networkResponse.data
                        val errorMessage = String(data)
                        Log.e("Volley Error", "Status code: $statusCode, Error message: $errorMessage")
                    } else {
                        Log.e("Volley Error", "Error: ${error.message}")
                    }
                    continuation.resumeWithException(error)
                }
            )

            Volley.newRequestQueue(appContext).add(request)

            continuation.invokeOnCancellation {
                request.cancel()
            }
        }

        try {
            val socials = Klaxon().parse<ProfileSocials>(response.toString(Charsets.UTF_8))
            socials?.let {
                saveProfileSocials(appContext, account, address, socials)
            }
        } catch (e: Exception) {
            Log.d("GetProfilesState", "Could not parse returned profile value from backend")
        }
    }
}

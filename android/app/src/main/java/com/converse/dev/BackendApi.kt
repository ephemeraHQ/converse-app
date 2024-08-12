package com.converse.dev

import com.android.volley.toolbox.JsonObjectRequest
import kotlinx.coroutines.suspendCancellableCoroutine
import com.android.volley.Request
import android.util.Log
import kotlin.coroutines.resumeWithException
import android.content.Context
import com.android.volley.toolbox.Volley
import org.json.JSONObject
import org.xmtp.android.library.Client
import org.xmtp.android.library.messages.PrivateKeyBuilder
import kotlin.coroutines.resume
import android.util.Base64
import android.util.Base64.NO_WRAP


private suspend fun makePutRequest(appContext: Context, apiURI: String, address: String, signature: String, jsonObject: JSONObject): ByteArray {

    return suspendCancellableCoroutine { continuation ->
        val request = object : JsonObjectRequest(
            Request.Method.PUT, apiURI, jsonObject,
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
        ){
            override fun getHeaders(): Map<String, String> {
                val headers = HashMap<String, String>()
                headers["xmtp-api-signature"] = signature
                headers["xmtp-api-address"] = address
                return headers
            }
        }

        Volley.newRequestQueue(appContext).add(request)

        continuation.invokeOnCancellation {
            request.cancel()
        }
    }
}

suspend fun putGroupInviteRequest(appContext: Context, apiURI: String, xmtpClient: Client, joinRequestId: String, status: String) {
    val groupInviteEndpoint = "$apiURI/api/groupJoinRequest/$joinRequestId"
    val test = xmtpClient.keys.identityKey
    val privateKey = PrivateKeyBuilder.buildFromSignedPrivateKey(test)
    val signature = Base64.encodeToString(PrivateKeyBuilder(privateKey).sign("XMTP_IDENTITY".toByteArray()).toByteArray(), NO_WRAP)
    val address = xmtpClient.address
    val body = JSONObject().apply {
        put("status", status)
    }
    print(signature)
    makePutRequest(appContext, groupInviteEndpoint, address, signature, body)
}



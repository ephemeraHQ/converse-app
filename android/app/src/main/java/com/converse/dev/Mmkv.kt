package com.converse.dev
import android.content.Context
import android.util.Log
import com.beust.klaxon.Klaxon

import com.tencent.mmkv.MMKV;

private var mmkvInstance:MMKV? = null;

fun getMmkv(appContext: Context): MMKV? {
    if (mmkvInstance != null) {
        return mmkvInstance;
    }
    MMKV.initialize(appContext)
    mmkvInstance = MMKV.defaultMMKV(MMKV.MULTI_PROCESS_MODE, null)
    return mmkvInstance;
}

fun getAccountsState(appContext: Context): Accounts? {
    val mmkv = getMmkv(appContext)
    val accountsString = mmkv?.decodeString("store-accounts") ?: return null
    try {
        val decoded = Klaxon().parse<AccountsStore>(accountsString)
        return decoded?.state
    } catch (e: Exception) {
        sentryTrackError(e, mapOf("message" to "Could not parse the store-accounts data", "accountsString" to accountsString))
        Log.d("GetAccountsState", "Could not parse the store-accounts data")
        return null
    }
}

fun getCurrentAccount(appContext: Context): String? {
    val accountsState = getAccountsState(appContext)
    if (accountsState == null || accountsState?.currentAccount == "TEMPORARY_ACCOUNT") {
        return null
    }
    return accountsState?.currentAccount
}

fun getAccounts(appContext: Context): List<String> {
    val accountsState = getAccountsState(appContext) ?: return listOf()
    return accountsState?.accounts?.filter { it != "TEMPORARY_ACCOUNT" } ?: return listOf()
}

fun getBadge(appContext: Context): Int {
    val mmkv = getMmkv(appContext)
    return mmkv?.getInt("notifications-badge", 0) ?: 0
}

fun setBadge(appContext: Context, badge: Int) {
    val mmkv = getMmkv(appContext)
    mmkv?.putInt("notifications-badge", badge)
}
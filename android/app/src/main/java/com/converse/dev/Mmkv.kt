package com.converse.dev
import android.content.Context
import android.util.Log
import com.beust.klaxon.Klaxon
import com.tencent.mmkv.MMKV
import org.json.JSONArray
import org.json.JSONException
import java.util.Date

private var mmkvInstance:MMKV? = null;
private var secureMmkvForAccount:MutableMap<String, MMKV?> = mutableMapOf();
private var mmkvInitialized = false;


fun initializeMmkv(appContext: Context) {
    if (!mmkvInitialized) {
        mmkvInitialized = true;
        MMKV.initialize(appContext)
    }
}
fun getMmkv(appContext: Context): MMKV? {
    if (mmkvInstance != null) {
        return mmkvInstance;
    }
    initializeMmkv(appContext);
    mmkvInstance = MMKV.defaultMMKV(MMKV.MULTI_PROCESS_MODE, null)
    return mmkvInstance;
}

fun getSecureMmkvForAccount(appContext: Context, account: String): MMKV? {
    if (secureMmkvForAccount[account] != null) {
        return secureMmkvForAccount[account];
    }
    initializeMmkv(appContext);
    val accountEncryptionKey =  getKeychainValue("CONVERSE_ACCOUNT_ENCRYPTION_KEY_$account")
    if (accountEncryptionKey === null) {
        return null;
    }
    secureMmkvForAccount[account] = MMKV.mmkvWithID("secure-mmkv-$account", MMKV.MULTI_PROCESS_MODE, accountEncryptionKey.substring(0, 16))
    return secureMmkvForAccount[account];
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

fun getShownNotificationIds(appContext: Context): List<String> {
    val mmkv = getMmkv(appContext)
    val jsonData = mmkv?.decodeString("notification-ids") ?: return listOf()

    val idList = mutableListOf<String>()
    try {
        val jsonArray = JSONArray(jsonData)
        for (i in 0 until jsonArray.length()) {
            idList.add(jsonArray.getString(i))
        }
    } catch (e: JSONException) {
        e.printStackTrace()
    }

    return idList
}

fun setShownNotificationIds(appContext: Context, ids: List<String>) {
    val mmkv = getMmkv(appContext)
    val jsonArray = JSONArray(ids)
    mmkv?.encode("notification-ids", jsonArray.toString())
}

fun getProfilesStore(appContext: Context, account: String): ProfilesStore? {
    val mmkv = getMmkv(appContext)
    val profilesString = mmkv?.decodeString("store-$account-profiles") ?: return null
    try {
        val decoded = Klaxon().parse<ProfilesStore>(profilesString)
        return decoded
    } catch (e: Exception) {
        sentryTrackError(e, mapOf("message" to "Could not parse the store-$account-profiles data", "profilesString" to profilesString))
        Log.d("GetProfilesState", "Could not parse the store-$account-profiles data: $e")
        return null
    }
}

fun saveProfileSocials(appContext: Context, account: String, address: String, socials: ProfileSocials) {
    // Retrieve the current profiles store or create a new one if it doesn't exist
    var profilesStore = getProfilesStore(appContext, account) ?: ProfilesStore(Profiles(mutableMapOf()), 0)

    // Ensure the profiles map is not null
    if (profilesStore.state.profiles == null) {
        profilesStore.state.profiles = mutableMapOf()
    }

    // Get the current timestamp
    val updatedAt = (Date().time / 1000).toLong()

    // Create a new profile with the updated timestamp and socials
    val newProfile = Profile(updatedAt, socials)

    // Update the profiles map with the new profile
    profilesStore.state.profiles!![address] = newProfile

    // Get the MMKV instance
    val mmkv = getMmkv(appContext)

    // Encode the profiles store to JSON and save it to MMKV
    val jsonString = Klaxon().toJsonString(profilesStore)
    mmkv?.encode("store-$account-profiles", jsonString)
}
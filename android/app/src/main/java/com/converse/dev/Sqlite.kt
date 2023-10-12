package com.converse.dev

import android.database.sqlite.SQLiteDatabase
import android.content.Context
import android.database.Cursor
import android.util.Log
import com.google.gson.Gson
import java.io.File


private var openedDbs = mutableMapOf<String, SQLiteDatabase>();

// Not used anymore for now, was used to find which account should
// handle a notification but now the payload includes the account.
// Better because handling SQLite in multiple threads might be tricky!
fun getDbName(appContext: Context, account: String): String {
    val accountsState = getAccountsState(appContext)
    val databaseId = accountsState?.databaseId?.get(account) ?: account
    return "converse-${databaseId}.sqlite"
}

fun getDb(appContext: Context, account: String): SQLiteDatabase? {
    val dbName = getDbName(appContext, account)
    var database = openedDbs[dbName]
    if (database != null) {
        Log.d("DB", "DATABASE ALREADY OPENED FOR $dbName")
        return database as SQLiteDatabase;
    }
    val databasePath = appContext.getDatabasePath(getDbName(appContext, account)).path

    return if (File(databasePath).exists()) {
        database = SQLiteDatabase.openDatabase(databasePath, null, SQLiteDatabase.OPEN_READWRITE)
        database.enableWriteAheadLogging()
        openedDbs[dbName] = database
        database as SQLiteDatabase
    } else {
        null
    }
}
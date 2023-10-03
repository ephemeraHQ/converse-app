package com.converse.dev

import android.database.sqlite.SQLiteDatabase
import android.content.Context
import android.database.Cursor
import android.util.Log
import com.google.gson.Gson
import java.io.File


private var openedDbs = mutableMapOf<String, SQLiteDatabase>();

fun getDbName(appContext: Context, account: String): String {
    val accountsState = getAccountsState(appContext)
    val databaseId = accountsState?.databaseId?.get(account) ?: account
    return "converse-${databaseId}.sqlite"
}

fun getDb(appContext: Context, account: String): SQLiteDatabase? {
    val dbName = getDbName(appContext, account)
    var database = openedDbs[dbName]
    if (database != null) {
        Log.d("DB", "DATABASE ALREADY OPEND FOR $dbName")
        return database as SQLiteDatabase;
    }
    var databasePath = "${appContext.filesDir.absolutePath}/SQLite/$dbName"
    if (!File(databasePath).exists()) {
        // TODO => remove in the future because migration to react-native-quick-sqlite
        // made us change path
        databasePath = appContext.getDatabasePath(getDbName(appContext, account)).path
    }

    return if (File(databasePath).exists()) {
        database = SQLiteDatabase.openDatabase(databasePath, null, SQLiteDatabase.OPEN_READWRITE)
        database.enableWriteAheadLogging()
        openedDbs[dbName] = database
        database as SQLiteDatabase
    } else {
        null
    }
}

fun getConversations(appContext: Context, account: String) {
    val db = getDb(appContext, account) ?: return
    val query = "SELECT * FROM conversation"
    val cursor: Cursor = db.rawQuery(query, null)

    // Loop through the cursor and retrieve data
    if (cursor.moveToFirst()) do {
        val topic = cursor.getString(cursor.getColumnIndexOrThrow("topic"))
        Log.d("DEBUG", "GOT TOPIC ${topic}")
    } while (cursor.moveToNext())

    // Close the cursor
    cursor.close()
}

fun hasTopic(appContext: Context, account: String, topic: String): Boolean {
    val db = getDb(appContext, account) ?: return false
    val query = "SELECT COUNT(topic) FROM conversation WHERE topic = ?;"
    val cursor: Cursor = db.rawQuery(query, arrayOf(topic))

    // Process the count value from the cursor
    var count = 0
    if (cursor != null && cursor.moveToFirst()) {
        count = cursor.getInt(0)
    }
    // Close the cursor
    cursor.close()
    return count > 0
}


fun insertConversation(appContext: Context, account: String, topic: String, peerAddress: String, createdAt: Long, context: ConversationContext?) {
    val db = getDb(appContext, account) ?: throw Exception("No Db Found")
    val query = "INSERT INTO conversation (topic, peerAddress, createdAt, contextConversationId, contextMetadata) VALUES (?, ?, ?, ?, ?);"
    var contextMetadata = if (context != null && context.metadata != null) Gson().toJson(context.metadata) else null
    db.execSQL(query, arrayOf(topic, peerAddress, createdAt, context?.conversationId, contextMetadata))
}

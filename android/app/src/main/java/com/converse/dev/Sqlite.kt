package com.converse.dev

import android.database.sqlite.SQLiteDatabase
import android.content.Context
import android.database.Cursor
import android.util.Log
import com.google.gson.Gson
import java.io.File


private var dbByAccount = mapOf<String, SQLiteDatabase>();

fun getDb(appContext: Context, account: String): SQLiteDatabase? {
    var database = dbByAccount[account]
    if (database != null) {
        return database as SQLiteDatabase;
    }
    val databasePath = appContext.getDatabasePath("converse-${account}.sqlite").path
    return if (File(databasePath).exists()) {
        Log.d("DB PATH", databasePath)
        database = SQLiteDatabase.openDatabase(databasePath, null, SQLiteDatabase.OPEN_READWRITE)
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

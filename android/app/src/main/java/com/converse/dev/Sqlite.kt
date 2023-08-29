package com.converse.dev

import android.database.sqlite.SQLiteDatabase
import android.content.Context
import android.database.Cursor
import android.util.Log
import java.io.File


private var database: SQLiteDatabase? = null;

fun getDb(appContext: Context, account: String): SQLiteDatabase? {
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


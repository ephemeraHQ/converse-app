package com.converse.dev
import android.content.Context

import com.tencent.mmkv.MMKV;

private var mmkvInstance:MMKV? = null;

fun getMmkv(appContext: Context): MMKV? {
    if (mmkvInstance != null) {
        return mmkvInstance;
    }
    MMKV.initialize(appContext)
    mmkvInstance = MMKV.defaultMMKV()
    return mmkvInstance;
}
package com.antislot

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import org.json.JSONArray

class SharedConfigModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val tag = "SharedConfigModule"

  override fun getName(): String = "SharedConfigModule"

  @ReactMethod
  fun saveBlocklist(domains: ReadableArray, promise: Promise) {
    try {
      SharedConfigStore.saveBlocklist(reactApplicationContext, toStringList(domains))
      promise.resolve(true)
    } catch (error: Exception) {
      Log.e(tag, "saveBlocklist failed", error)
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun savePatterns(patterns: ReadableArray, promise: Promise) {
    try {
      SharedConfigStore.savePatterns(
        reactApplicationContext,
        JSONArray(patterns.toArrayList()).toString()
      )
      promise.resolve(true)
    } catch (error: Exception) {
      Log.e(tag, "savePatterns failed", error)
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun saveWhitelist(domains: ReadableArray, promise: Promise) {
    try {
      SharedConfigStore.saveWhitelist(reactApplicationContext, toStringList(domains))
      promise.resolve(true)
    } catch (error: Exception) {
      Log.e(tag, "saveWhitelist failed", error)
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun saveBlockerHardening(
    strictMode: Boolean,
    blockDoh: Boolean,
    blockDot: Boolean,
    blockQuic: Boolean,
    lockdownVpn: Boolean,
    tamperAlerts: Boolean,
    promise: Promise
  ) {
    try {
      SharedConfigStore.saveBlockerHardening(
        context = reactApplicationContext,
        strictMode = strictMode,
        blockDoh = blockDoh,
        blockDot = blockDot,
        blockQuic = blockQuic,
        lockdownVpn = lockdownVpn,
        tamperAlerts = tamperAlerts
      )
      promise.resolve(true)
    } catch (error: Exception) {
      Log.e(tag, "saveBlockerHardening failed", error)
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun saveSmsSettings(
    enabled: Boolean,
    strictMode: Boolean,
    customKeywords: ReadableArray,
    autoDeleteDays: Int,
    promise: Promise
  ) {
    try {
      SharedConfigStore.saveSmsSettings(
        context = reactApplicationContext,
        enabled = enabled,
        strictMode = strictMode,
        keywords = toStringList(customKeywords),
        autoDeleteDays = autoDeleteDays.takeIf { it >= 0 }
      )
      promise.resolve(true)
    } catch (error: Exception) {
      Log.e(tag, "saveSmsSettings failed", error)
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun getSmsBlockedCount(promise: Promise) {
    try {
      promise.resolve(SharedConfigStore.getBlockedCount(reactApplicationContext))
    } catch (error: Exception) {
      Log.e(tag, "getSmsBlockedCount failed", error)
      promise.resolve(0)
    }
  }

  @ReactMethod
  fun resetSmsBlockedCount(promise: Promise) {
    try {
      SharedConfigStore.resetBlockedCount(reactApplicationContext)
      promise.resolve(true)
    } catch (error: Exception) {
      Log.e(tag, "resetSmsBlockedCount failed", error)
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun cleanupSpamInboxNow(promise: Promise) {
    try {
      val deleted = SharedConfigStore.cleanupSpamInboxNow(reactApplicationContext)
      promise.resolve(deleted)
    } catch (error: Exception) {
      Log.e(tag, "cleanupSpamInboxNow failed", error)
      promise.resolve(0)
    }
  }

  private fun toStringList(array: ReadableArray): List<String> {
    val items = mutableListOf<String>()
    for (index in 0 until array.size()) {
      if (array.getType(index) == ReadableType.String) {
        array.getString(index)?.let { value ->
          if (value.isNotBlank()) items += value
        }
      }
    }
    return items
  }
}

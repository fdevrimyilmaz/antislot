package com.antislot

import android.app.Activity
import android.app.role.RoleManager
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SmsRoleModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private val tag = "SmsRoleModule"
  private val requestCodeSmsRole = 9002
  private var pendingPromise: Promise? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = "SmsRoleModule"

  @ReactMethod
  fun isDefaultSmsApp(promise: Promise) {
    promise.resolve(checkIsDefaultSmsApp())
  }

  @ReactMethod
  fun requestDefaultSmsRole(promise: Promise) {
    try {
      if (checkIsDefaultSmsApp()) {
        promise.resolve(true)
        return
      }

      val activity = reactApplicationContext.currentActivity
      if (activity == null) {
        Log.w(tag, "Cannot request SMS role: activity unavailable")
        promise.resolve(false)
        return
      }

      if (pendingPromise != null) {
        Log.w(tag, "SMS role request already in progress")
        promise.resolve(false)
        return
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val roleManager = activity.getSystemService(RoleManager::class.java)
        if (roleManager == null || !roleManager.isRoleAvailable(RoleManager.ROLE_SMS)) {
          Log.w(tag, "SMS role is unavailable on this device")
          promise.resolve(false)
          return
        }

        pendingPromise = promise
        val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS)
        activity.startActivityForResult(intent, requestCodeSmsRole)
      } else {
        pendingPromise = promise
        val intent = Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT).apply {
          putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, reactApplicationContext.packageName)
        }
        activity.startActivityForResult(intent, requestCodeSmsRole)
      }
    } catch (error: Exception) {
      pendingPromise = null
      Log.e(tag, "SMS role request failed", error)
      promise.resolve(false)
    }
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
    if (requestCode != requestCodeSmsRole) return
    val promise = pendingPromise ?: return
    pendingPromise = null
    promise.resolve(checkIsDefaultSmsApp())
  }

  override fun onNewIntent(intent: Intent) = Unit

  private fun checkIsDefaultSmsApp(): Boolean {
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val roleManager = reactApplicationContext.getSystemService(RoleManager::class.java)
        roleManager?.isRoleHeld(RoleManager.ROLE_SMS) == true
      } else {
        val defaultPackage = Telephony.Sms.getDefaultSmsPackage(reactApplicationContext)
        defaultPackage == reactApplicationContext.packageName
      }
    } catch (error: Exception) {
      Log.w(tag, "Failed to check SMS default role", error)
      false
    }
  }
}

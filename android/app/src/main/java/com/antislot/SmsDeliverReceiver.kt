package com.antislot

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Telephony
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

class SmsDeliverReceiver : BroadcastReceiver() {

  private val tag = "SmsDeliverReceiver"

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_DELIVER_ACTION) return

    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
    if (messages.isNullOrEmpty()) return

    val sender = messages.firstOrNull()?.originatingAddress.orEmpty()
    val body = messages.joinToString(separator = "") { it.messageBody.orEmpty() }.trim()
    val receivedAt = messages.firstOrNull()?.timestampMillis ?: System.currentTimeMillis()

    if (body.isBlank()) return

    val settings = SharedConfigStore.loadSmsSettings(context)

    if (settings.enabled && settings.autoDeleteDays != null) {
      val cleaned = SharedConfigStore.cleanupSpamInboxIfDue(context, settings)
      if (cleaned > 0) {
        Log.i(tag, "Auto-cleanup removed $cleaned old spam SMS from inbox")
      }
    }

    if (settings.enabled) {
      val result = SmsSpamClassifier.classify(sender, body, settings)
      if (result.isSpam) {
        val blockedCount = SharedConfigStore.incrementBlockedCount(context)
        Log.i(
          tag,
          "Blocked incoming SMS sender=$sender confidence=${result.confidence} reasons=${result.reasons.joinToString("|")} totalBlocked=$blockedCount"
        )
        return
      }
    }

    val inserted = insertInboxMessage(context, sender, body, receivedAt)
    if (!inserted) {
      Log.w(tag, "SMS was allowed but could not be inserted into inbox")
    }

    showNotification(context, sender, body)
  }

  private fun insertInboxMessage(
    context: Context,
    sender: String,
    body: String,
    receivedAt: Long
  ): Boolean {
    return try {
      val values = ContentValues().apply {
        put(Telephony.Sms.ADDRESS, sender)
        put(Telephony.Sms.BODY, body)
        put(Telephony.Sms.DATE, receivedAt)
        put(Telephony.Sms.READ, 0)
        put(Telephony.Sms.SEEN, 0)
        put(Telephony.Sms.TYPE, Telephony.Sms.MESSAGE_TYPE_INBOX)
      }
      context.contentResolver.insert(Telephony.Sms.Inbox.CONTENT_URI, values) != null
    } catch (error: Exception) {
      Log.e(tag, "Inbox insert failed", error)
      false
    }
  }

  private fun showNotification(context: Context, sender: String, body: String) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      return
    }

    createNotificationChannel(context)

    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val pendingIntent = launchIntent?.let {
      PendingIntent.getActivity(
        context,
        0,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or pendingIntentImmutableFlag()
      )
    }

    val senderTitle = sender.ifBlank { "Bilinmeyen gonderici" }
    val preview = if (body.length > 140) body.take(137) + "..." else body

    val builder = NotificationCompat.Builder(context, SMS_CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(senderTitle)
      .setContentText(preview)
      .setStyle(NotificationCompat.BigTextStyle().bigText(preview))
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_MESSAGE)

    if (pendingIntent != null) {
      builder.setContentIntent(pendingIntent)
    }

    NotificationManagerCompat.from(context)
      .notify(System.currentTimeMillis().toInt(), builder.build())
  }

  private fun createNotificationChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = context.getSystemService(NotificationManager::class.java)
    val channel = NotificationChannel(
      SMS_CHANNEL_ID,
      "Antislot SMS",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Spam olmayan SMS bildirimleri"
    }
    manager.createNotificationChannel(channel)
  }

  private fun pendingIntentImmutableFlag(): Int {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_IMMUTABLE
    } else {
      0
    }
  }

  companion object {
    private const val SMS_CHANNEL_ID = "antislot_sms_inbox"
  }
}

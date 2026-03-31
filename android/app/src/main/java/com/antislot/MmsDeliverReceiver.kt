package com.antislot

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Telephony
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

class MmsDeliverReceiver : BroadcastReceiver() {
  private val tag = "MmsDeliverReceiver"

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.WAP_PUSH_DELIVER_ACTION) return

    Log.i(tag, "Received MMS WAP push")
    showUnsupportedMmsNotification(context)
  }

  private fun showUnsupportedMmsNotification(context: Context) {
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

    val builder = NotificationCompat.Builder(context, MMS_CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle("Yeni MMS")
      .setContentText("MMS su an otomatik filtrelenmiyor. Lutfen mesaji uygulama icinden kontrol et.")
      .setStyle(
        NotificationCompat.BigTextStyle().bigText(
          "MMS su an otomatik filtrelenmiyor. Lutfen mesaji uygulama icinden kontrol et."
        )
      )
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
      MMS_CHANNEL_ID,
      "Antislot MMS",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "MMS fallback bildirimleri"
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
    private const val MMS_CHANNEL_ID = "antislot_mms_fallback"
  }
}

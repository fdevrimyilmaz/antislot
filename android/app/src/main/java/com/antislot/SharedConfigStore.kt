package com.antislot

import android.content.ContentUris
import android.content.Context
import android.provider.Telephony
import android.util.Log
import java.text.Normalizer
import java.util.Locale
import org.json.JSONArray
import org.json.JSONObject

data class SmsNativeSettings(
  val enabled: Boolean,
  val strictMode: Boolean,
  val keywords: Set<String>,
  val autoDeleteDays: Int?
)

data class BlockerHardeningNativeSettings(
  val strictMode: Boolean,
  val blockDoh: Boolean,
  val blockDot: Boolean,
  val blockQuic: Boolean,
  val lockdownVpn: Boolean,
  val tamperAlerts: Boolean
)

data class BlocklistPattern(
  val pattern: String,
  val type: String,
  val weight: Double
)

object SharedConfigStore {
  private const val PREF_NAME = "antislot_shared_config"
  private const val TAG = "SharedConfigStore"

  private const val KEY_BLOCKLIST = "blocker.blocklist"
  private const val KEY_PATTERNS = "blocker.patterns"
  private const val KEY_WHITELIST = "blocker.whitelist"
  private const val KEY_BLOCKLIST_VERSION = "blocker.blocklist.version"
  private const val KEY_BLOCKLIST_UPDATED_AT = "blocker.blocklist.updatedAt"
  private const val KEY_PATTERNS_VERSION = "blocker.patterns.version"
  private const val KEY_PATTERNS_UPDATED_AT = "blocker.patterns.updatedAt"
  private const val KEY_BLOCKLIST_LAST_SYNC_AT = "blocker.blocklist.lastSyncAt"
  private const val KEY_BLOCKER_HARDENING_STRICT_MODE = "blocker.hardening.strictMode"
  private const val KEY_BLOCKER_HARDENING_BLOCK_DOH = "blocker.hardening.blockDoh"
  private const val KEY_BLOCKER_HARDENING_BLOCK_DOT = "blocker.hardening.blockDot"
  private const val KEY_BLOCKER_HARDENING_BLOCK_QUIC = "blocker.hardening.blockQuic"
  private const val KEY_BLOCKER_HARDENING_LOCKDOWN_VPN = "blocker.hardening.lockdownVpn"
  private const val KEY_BLOCKER_HARDENING_TAMPER_ALERTS = "blocker.hardening.tamperAlerts"
  private const val KEY_SMS_ENABLED = "sms.enabled"
  private const val KEY_SMS_STRICT_MODE = "sms.strictMode"
  private const val KEY_SMS_KEYWORDS = "sms.keywords"
  private const val KEY_SMS_AUTO_DELETE_DAYS = "sms.autoDeleteDays"
  private const val KEY_SMS_BLOCKED_COUNT = "sms.blockedCount"
  private const val KEY_SMS_LAST_CLEANUP_AT = "sms.lastCleanupAt"

  private const val CLEANUP_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000L
  private const val DAY_MS = 24 * 60 * 60 * 1000L

  private val fallbackKeywords = setOf(
    "bahis",
    "casino",
    "slot",
    "bonus",
    "freebet",
    "promo",
    "kupon",
    "jackpot",
    "iddaa",
    "canli bahis",
    "sanal bahis",
    "betting",
    "sportsbook",
    "verify your account",
    "urgent action"
  )

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

  fun saveBlocklist(context: Context, domains: List<String>) {
    prefs(context)
      .edit()
      .putString(KEY_BLOCKLIST, JSONArray(domains).toString())
      .apply()
  }

  fun saveSyncSnapshot(
    context: Context,
    domains: List<String>,
    rawPatternsJson: String,
    blocklistVersion: Int,
    blocklistUpdatedAt: Long,
    patternsVersion: Int,
    patternsUpdatedAt: Long,
    syncedAt: Long
  ): Boolean {
    val normalizedDomains = domains
      .map { it.lowercase(Locale.ROOT).trim() }
      .filter { it.isNotEmpty() }
      .distinct()

    return prefs(context)
      .edit()
      .putString(KEY_BLOCKLIST, JSONArray(normalizedDomains).toString())
      .putInt(KEY_BLOCKLIST_VERSION, blocklistVersion)
      .putLong(KEY_BLOCKLIST_UPDATED_AT, blocklistUpdatedAt)
      .putString(KEY_PATTERNS, rawPatternsJson)
      .putInt(KEY_PATTERNS_VERSION, patternsVersion)
      .putLong(KEY_PATTERNS_UPDATED_AT, patternsUpdatedAt)
      .putLong(KEY_BLOCKLIST_LAST_SYNC_AT, syncedAt)
      .commit()
  }

  fun saveBlocklistSnapshot(
    context: Context,
    domains: List<String>,
    version: Int,
    updatedAt: Long,
    syncedAt: Long
  ): Boolean {
    val normalizedDomains = domains
      .map { it.lowercase(Locale.ROOT).trim() }
      .filter { it.isNotEmpty() }
      .distinct()

    return prefs(context)
      .edit()
      .putString(KEY_BLOCKLIST, JSONArray(normalizedDomains).toString())
      .putInt(KEY_BLOCKLIST_VERSION, version)
      .putLong(KEY_BLOCKLIST_UPDATED_AT, updatedAt)
      .putLong(KEY_BLOCKLIST_LAST_SYNC_AT, syncedAt)
      .commit()
  }

  fun savePatterns(context: Context, rawPatternsJson: String) {
    prefs(context)
      .edit()
      .putString(KEY_PATTERNS, rawPatternsJson)
      .apply()
  }

  fun savePatternsSnapshot(
    context: Context,
    rawPatternsJson: String,
    version: Int,
    updatedAt: Long,
    syncedAt: Long
  ): Boolean {
    return prefs(context)
      .edit()
      .putString(KEY_PATTERNS, rawPatternsJson)
      .putInt(KEY_PATTERNS_VERSION, version)
      .putLong(KEY_PATTERNS_UPDATED_AT, updatedAt)
      .putLong(KEY_BLOCKLIST_LAST_SYNC_AT, syncedAt)
      .commit()
  }

  fun markBlocklistSynced(context: Context, syncedAt: Long): Boolean {
    return prefs(context)
      .edit()
      .putLong(KEY_BLOCKLIST_LAST_SYNC_AT, syncedAt)
      .commit()
  }

  fun saveWhitelist(context: Context, domains: List<String>) {
    prefs(context)
      .edit()
      .putString(KEY_WHITELIST, JSONArray(domains).toString())
      .apply()
  }

  fun loadBlocklistDomains(context: Context): Set<String> {
    val raw = prefs(context).getString(KEY_BLOCKLIST, null) ?: return emptySet()
    return parseStringArray(raw)
      .map { it.lowercase(Locale.ROOT).trim() }
      .filter { it.isNotEmpty() }
      .toSet()
  }

  fun loadWhitelistDomains(context: Context): Set<String> {
    val raw = prefs(context).getString(KEY_WHITELIST, null) ?: return emptySet()
    return parseStringArray(raw)
      .map { it.lowercase(Locale.ROOT).trim() }
      .filter { it.isNotEmpty() }
      .toSet()
  }

  fun loadBlocklistPatterns(context: Context): List<BlocklistPattern> {
    val raw = prefs(context).getString(KEY_PATTERNS, null) ?: return emptyList()
    return parsePatterns(raw)
  }

  fun loadBlocklistVersion(context: Context): Int? {
    val storage = prefs(context)
    if (!storage.contains(KEY_BLOCKLIST_VERSION)) return null
    val value = storage.getInt(KEY_BLOCKLIST_VERSION, -1)
    return value.takeIf { it >= 0 }
  }

  fun loadBlocklistUpdatedAt(context: Context): Long? {
    val storage = prefs(context)
    if (!storage.contains(KEY_BLOCKLIST_UPDATED_AT)) return null
    val value = storage.getLong(KEY_BLOCKLIST_UPDATED_AT, -1L)
    return value.takeIf { it >= 0L }
  }

  fun loadPatternsVersion(context: Context): Int? {
    val storage = prefs(context)
    if (!storage.contains(KEY_PATTERNS_VERSION)) return null
    val value = storage.getInt(KEY_PATTERNS_VERSION, -1)
    return value.takeIf { it >= 0 }
  }

  fun loadPatternsUpdatedAt(context: Context): Long? {
    val storage = prefs(context)
    if (!storage.contains(KEY_PATTERNS_UPDATED_AT)) return null
    val value = storage.getLong(KEY_PATTERNS_UPDATED_AT, -1L)
    return value.takeIf { it >= 0L }
  }

  fun saveBlockerHardening(
    context: Context,
    strictMode: Boolean,
    blockDoh: Boolean,
    blockDot: Boolean,
    blockQuic: Boolean,
    lockdownVpn: Boolean,
    tamperAlerts: Boolean
  ) {
    prefs(context)
      .edit()
      .putBoolean(KEY_BLOCKER_HARDENING_STRICT_MODE, strictMode)
      .putBoolean(KEY_BLOCKER_HARDENING_BLOCK_DOH, blockDoh)
      .putBoolean(KEY_BLOCKER_HARDENING_BLOCK_DOT, blockDot)
      .putBoolean(KEY_BLOCKER_HARDENING_BLOCK_QUIC, blockQuic)
      .putBoolean(KEY_BLOCKER_HARDENING_LOCKDOWN_VPN, lockdownVpn)
      .putBoolean(KEY_BLOCKER_HARDENING_TAMPER_ALERTS, tamperAlerts)
      .apply()
  }

  fun loadBlockerHardening(context: Context): BlockerHardeningNativeSettings {
    val storage = prefs(context)
    return BlockerHardeningNativeSettings(
      strictMode = storage.getBoolean(KEY_BLOCKER_HARDENING_STRICT_MODE, true),
      blockDoh = storage.getBoolean(KEY_BLOCKER_HARDENING_BLOCK_DOH, true),
      blockDot = storage.getBoolean(KEY_BLOCKER_HARDENING_BLOCK_DOT, true),
      blockQuic = storage.getBoolean(KEY_BLOCKER_HARDENING_BLOCK_QUIC, true),
      lockdownVpn = storage.getBoolean(KEY_BLOCKER_HARDENING_LOCKDOWN_VPN, false),
      tamperAlerts = storage.getBoolean(KEY_BLOCKER_HARDENING_TAMPER_ALERTS, true)
    )
  }

  fun saveSmsSettings(
    context: Context,
    enabled: Boolean,
    strictMode: Boolean,
    keywords: List<String>,
    autoDeleteDays: Int?
  ) {
    val normalizedKeywords = keywords
      .map { normalizeKeyword(it) }
      .filter { it.isNotEmpty() }
      .toSet()

    val editor = prefs(context).edit()
      .putBoolean(KEY_SMS_ENABLED, enabled)
      .putBoolean(KEY_SMS_STRICT_MODE, strictMode)
      .putStringSet(KEY_SMS_KEYWORDS, normalizedKeywords)

    if (autoDeleteDays == null) {
      editor.remove(KEY_SMS_AUTO_DELETE_DAYS)
    } else {
      editor.putInt(KEY_SMS_AUTO_DELETE_DAYS, autoDeleteDays)
    }

    editor.apply()
  }

  fun loadSmsSettings(context: Context): SmsNativeSettings {
    val storage = prefs(context)
    val enabled = storage.getBoolean(KEY_SMS_ENABLED, true)
    val strictMode = storage.getBoolean(KEY_SMS_STRICT_MODE, true)
    val autoDeleteDays = if (storage.contains(KEY_SMS_AUTO_DELETE_DAYS)) {
      storage.getInt(KEY_SMS_AUTO_DELETE_DAYS, -1).takeIf { it in setOf(1, 3, 7, 14, 30, 60, 90) }
    } else {
      null
    }

    val rawKeywords = storage.getStringSet(KEY_SMS_KEYWORDS, null)
      ?.map { normalizeKeyword(it) }
      ?.filter { it.isNotEmpty() }
      ?.toSet()
      .orEmpty()

    val keywords = if (rawKeywords.isEmpty()) fallbackKeywords else rawKeywords
    return SmsNativeSettings(enabled, strictMode, keywords, autoDeleteDays)
  }

  fun incrementBlockedCount(context: Context): Int {
    val storage = prefs(context)
    val next = storage.getInt(KEY_SMS_BLOCKED_COUNT, 0) + 1
    storage.edit().putInt(KEY_SMS_BLOCKED_COUNT, next).apply()
    return next
  }

  fun incrementBlockedCountBy(context: Context, amount: Int): Int {
    if (amount <= 0) return getBlockedCount(context)
    val storage = prefs(context)
    val next = storage.getInt(KEY_SMS_BLOCKED_COUNT, 0) + amount
    storage.edit().putInt(KEY_SMS_BLOCKED_COUNT, next).apply()
    return next
  }

  fun getBlockedCount(context: Context): Int {
    return prefs(context).getInt(KEY_SMS_BLOCKED_COUNT, 0)
  }

  fun resetBlockedCount(context: Context) {
    prefs(context).edit().remove(KEY_SMS_BLOCKED_COUNT).apply()
  }

  fun cleanupSpamInboxIfDue(context: Context, settings: SmsNativeSettings): Int {
    if (settings.autoDeleteDays == null) return 0

    val storage = prefs(context)
    val now = System.currentTimeMillis()
    val lastRun = storage.getLong(KEY_SMS_LAST_CLEANUP_AT, 0L)

    if (now - lastRun < CLEANUP_MIN_INTERVAL_MS) {
      return 0
    }

    val deleted = cleanupSpamInbox(context, settings, maxScan = 500)
    storage.edit().putLong(KEY_SMS_LAST_CLEANUP_AT, now).apply()
    return deleted
  }

  fun cleanupSpamInboxNow(context: Context): Int {
    val settings = loadSmsSettings(context)
    return cleanupSpamInbox(context, settings, maxScan = 1200)
  }

  private fun cleanupSpamInbox(context: Context, settings: SmsNativeSettings, maxScan: Int): Int {
    val retentionDays = settings.autoDeleteDays ?: return 0
    val cutoffMs = System.currentTimeMillis() - (retentionDays.toLong() * DAY_MS)

    val projection = arrayOf(
      Telephony.Sms._ID,
      Telephony.Sms.ADDRESS,
      Telephony.Sms.BODY,
      Telephony.Sms.DATE
    )

    var deletedCount = 0

    try {
      context.contentResolver.query(
        Telephony.Sms.Inbox.CONTENT_URI,
        projection,
        "${Telephony.Sms.DATE} <= ?",
        arrayOf(cutoffMs.toString()),
        "${Telephony.Sms.DATE} ASC"
      )?.use { cursor ->
        val idIndex = cursor.getColumnIndex(Telephony.Sms._ID)
        val addressIndex = cursor.getColumnIndex(Telephony.Sms.ADDRESS)
        val bodyIndex = cursor.getColumnIndex(Telephony.Sms.BODY)

        var scanned = 0
        while (cursor.moveToNext() && scanned < maxScan) {
          scanned += 1

          val smsId = if (idIndex >= 0) cursor.getLong(idIndex) else -1L
          if (smsId <= 0L) continue

          val sender = if (addressIndex >= 0) cursor.getString(addressIndex).orEmpty() else ""
          val body = if (bodyIndex >= 0) cursor.getString(bodyIndex).orEmpty() else ""
          if (body.isBlank()) continue

          val result = SmsSpamClassifier.classify(sender, body, settings)
          if (!result.isSpam) continue

          val deleteUri = ContentUris.withAppendedId(Telephony.Sms.CONTENT_URI, smsId)
          val removed = context.contentResolver.delete(deleteUri, null, null)
          if (removed > 0) {
            deletedCount += removed
          }
        }
      }

      if (deletedCount > 0) {
        incrementBlockedCountBy(context, deletedCount)
      }
    } catch (error: Exception) {
      Log.w(TAG, "cleanupSpamInbox failed", error)
      return 0
    }

    return deletedCount
  }

  private fun normalizeKeyword(value: String): String {
    val lowered = value.lowercase(Locale.ROOT)
    val normalized = Normalizer.normalize(lowered, Normalizer.Form.NFD)
      .replace(Regex("\\p{InCombiningDiacriticalMarks}+"), "")

    return normalized
      .replace("\u0131", "i")
      .replace("\u015F", "s")
      .replace("\u011F", "g")
      .replace("\u00E7", "c")
      .replace("\u00F6", "o")
      .replace("\u00FC", "u")
      .replace(Regex("[^a-z0-9\\s]"), " ")
      .replace(Regex("\\s+"), " ")
      .trim()
  }

  private fun parseStringArray(raw: String): List<String> {
    return try {
      val array = JSONArray(raw)
      val result = mutableListOf<String>()
      for (index in 0 until array.length()) {
        val value = array.optString(index, "")
        if (value.isNotBlank()) {
          result += value
        }
      }
      result
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun parsePatterns(raw: String): List<BlocklistPattern> {
    return try {
      val array = JSONArray(raw)
      val patterns = mutableListOf<BlocklistPattern>()
      for (index in 0 until array.length()) {
        val item = array.opt(index)
        if (item !is JSONObject) continue
        val pattern = item.optString("pattern", "").trim()
        val type = item.optString("type", "").trim().lowercase(Locale.ROOT)
        val weight = item.optDouble("weight", 0.0)
        if (pattern.isBlank()) continue
        if (type !in setOf("exact", "subdomain", "contains", "regex")) continue
        patterns += BlocklistPattern(
          pattern = pattern,
          type = type,
          weight = weight
        )
      }
      patterns
    } catch (_: Exception) {
      emptyList()
    }
  }
}

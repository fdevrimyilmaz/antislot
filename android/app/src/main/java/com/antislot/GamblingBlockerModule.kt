package com.antislot

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.core.content.ContextCompat
import com.antislot.app.BuildConfig
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import org.json.JSONArray
import org.json.JSONObject

class GamblingBlockerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private val tag = "AntislotVpnModule"
  private val requestCodeVpn = 9001
  private var pendingPromise: Promise? = null
  private val localHosts = setOf("localhost", "127.0.0.1", "10.0.2.2", "10.0.3.2")
  private val requestTimeoutMs = 10000
  private val contentSchemaVersion = 1
  private val allowedPatternTypes = setOf("exact", "subdomain", "contains", "regex")

  private data class SignedBlocklistPayload(
    val version: Int,
    val updatedAt: Long,
    val schemaVersion: Int,
    val signature: String,
    val domains: List<String>,
    val signedPayload: JSONObject
  )

  private data class SignedPatternsPayload(
    val version: Int,
    val updatedAt: Long,
    val schemaVersion: Int,
    val signature: String,
    val patterns: JSONArray,
    val signedPayload: JSONObject
  )

  override fun getName(): String = "GamblingBlockerModule"

  init {
    reactContext.addActivityEventListener(this)
  }

  private fun resolveResult(
    promise: Promise?,
    status: String,
    reason: String? = null,
    message: String? = null
  ) {
    if (promise == null) return
    val map: WritableMap = Arguments.createMap()
    map.putString("status", status)
    if (!reason.isNullOrBlank()) {
      map.putString("reason", reason)
    }
    if (!message.isNullOrBlank()) {
      map.putString("message", message)
    }
    promise.resolve(map)
  }

  private fun getPrivateDnsMode(): String {
    return try {
      val mode = Settings.Global.getString(reactApplicationContext.contentResolver, "private_dns_mode")
      if (!mode.isNullOrBlank()) {
        mode.lowercase()
      } else {
        val fallback = Settings.Global.getString(
          reactApplicationContext.contentResolver,
          "private_dns_default_mode"
        )
        fallback?.lowercase() ?: "unknown"
      }
    } catch (_: Exception) {
      "unknown"
    }
  }

  private fun evaluateHardeningPreflight(): Pair<String, String>? {
    val hardening = SharedConfigStore.loadBlockerHardening(reactApplicationContext)

    if (hardening.lockdownVpn && Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return Pair(
        "lockdown_unsupported",
        "VPN lock-down hedefi bu Android surumunde desteklenmiyor."
      )
    }

    if (hardening.blockDot) {
      val privateDnsMode = getPrivateDnsMode()
      if (privateDnsMode == "hostname" || privateDnsMode == "opportunistic") {
        return Pair(
          "dot_active",
          "Private DNS aktif gorunuyor. DoT bypass riskini azaltmak icin Private DNS'i kapat."
        )
      }
    }

    return null
  }

  private fun normalizeApiUrl(raw: String): String {
    val trimmed = raw.trim()
    if (trimmed.isBlank()) return ""

    val lower = trimmed.lowercase(Locale.ROOT)
    val withScheme = if (lower.startsWith("http://") || lower.startsWith("https://")) {
      trimmed
    } else if (
      lower.startsWith("localhost") ||
      lower.startsWith("127.0.0.1") ||
      lower.startsWith("10.0.2.2") ||
      lower.startsWith("10.0.3.2")
    ) {
      "http://$trimmed"
    } else {
      "https://$trimmed"
    }
    return withScheme.trimEnd('/')
  }

  private fun isSecureApiUrl(url: String): Boolean {
    return try {
      val parsed = URL(url)
      val protocol = parsed.protocol.lowercase(Locale.ROOT)
      if (protocol == "https") return true
      if (protocol == "http") {
        val host = parsed.host.lowercase(Locale.ROOT)
        return BuildConfig.DEBUG || localHosts.contains(host)
      }
      false
    } catch (_: Exception) {
      false
    }
  }

  private fun buildApiEndpoint(baseUrl: String, resource: String): String {
    val normalizedBase = baseUrl.trimEnd('/')
    val normalizedResource = resource.trimStart('/')
    val lower = normalizedBase.lowercase(Locale.ROOT)
    return if (lower.endsWith("/v1")) {
      "$normalizedBase/$normalizedResource"
    } else {
      "$normalizedBase/v1/$normalizedResource"
    }
  }

  private fun readResponseBody(connection: HttpURLConnection): String {
    val stream = if (connection.responseCode in 200..299) {
      connection.inputStream
    } else {
      connection.errorStream
    } ?: return ""

    return stream.bufferedReader().use { reader ->
      reader.readText()
    }
  }

  private fun requestJson(
    endpointUrl: String,
    method: String,
    body: JSONObject? = null
  ): JSONObject {
    val endpoint = URL(endpointUrl)
    val connection = endpoint.openConnection() as HttpURLConnection
    connection.requestMethod = method
    connection.connectTimeout = requestTimeoutMs
    connection.readTimeout = requestTimeoutMs
    connection.setRequestProperty("Accept", "application/json")

    if (body != null) {
      val serialized = body.toString().toByteArray(Charsets.UTF_8)
      connection.doOutput = true
      connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
      connection.outputStream.use { output ->
        output.write(serialized)
      }
    }

    try {
      val status = connection.responseCode
      if (status !in 200..299) {
        throw IllegalStateException("HTTP_$status")
      }
      val raw = readResponseBody(connection)
      if (raw.isBlank()) {
        throw IllegalStateException("empty_response")
      }
      return JSONObject(raw)
    } finally {
      connection.disconnect()
    }
  }

  private fun fetchJson(baseUrl: String, resource: String): JSONObject {
    return requestJson(
      endpointUrl = buildApiEndpoint(baseUrl, resource),
      method = "GET"
    )
  }

  private fun postJson(baseUrl: String, resource: String, body: JSONObject): JSONObject {
    return requestJson(
      endpointUrl = buildApiEndpoint(baseUrl, resource),
      method = "POST",
      body = body
    )
  }

  private fun normalizeSchemaVersion(raw: Any?): Int {
    val parsed = when (raw) {
      is Number -> raw.toInt()
      is String -> raw.toIntOrNull()
      else -> null
    } ?: 1
    return if (parsed <= 0) 1 else parsed
  }

  private fun ensureSchemaCompatible(schemaVersion: Int, contentType: String) {
    if (schemaVersion > contentSchemaVersion) {
      throw IllegalStateException("incompatible_${contentType}_schema_v$schemaVersion")
    }
  }

  private fun normalizeDomain(value: String): String {
    return value
      .trim()
      .lowercase(Locale.ROOT)
      .removePrefix("http://")
      .removePrefix("https://")
      .removePrefix("www.")
      .substringBefore("/")
      .substringBefore("?")
      .substringBefore("#")
      .trim('.')
  }

  private fun parseDomainList(source: JSONArray): List<String> {
    val normalized = linkedSetOf<String>()
    for (index in 0 until source.length()) {
      val value = normalizeDomain(source.optString(index, ""))
      if (value.isBlank()) continue
      normalized += value
    }
    return normalized.toList()
  }

  private fun parsePatternsArray(source: JSONArray): JSONArray {
    val dedupe = linkedSetOf<String>()
    val normalized = JSONArray()

    for (index in 0 until source.length()) {
      val rawItem = source.opt(index)
      if (rawItem !is JSONObject) continue

      val rawPattern = rawItem.optString("pattern", "").trim()
      val type = rawItem.optString("type", "").trim().lowercase(Locale.ROOT)
      val weight = rawItem.optDouble("weight", Double.NaN)
      if (rawPattern.isBlank() || type !in allowedPatternTypes || !weight.isFinite()) continue

      val pattern = if (type == "regex") rawPattern else normalizeDomain(rawPattern)
      if (pattern.isBlank()) continue

      val dedupeKey = "$type::$pattern"
      if (!dedupe.add(dedupeKey)) continue

      normalized.put(
        JSONObject()
          .put("pattern", pattern)
          .put("type", type)
          .put("weight", weight.coerceIn(0.0, 1.0))
      )
    }

    return normalized
  }

  private fun parseSignedBlocklistPayload(payload: JSONObject): SignedBlocklistPayload {
    val version = payload.optInt("version", -1)
    val updatedAt = payload.optLong("updatedAt", -1L)
    val signature = payload.optString("signature", "").trim()
    val rawDomains = payload.opt("domains")
    if (version < 0 || updatedAt < 0L || signature.isBlank() || rawDomains !is JSONArray) {
      throw IllegalStateException("invalid_blocklist_payload")
    }

    val rawSchemaVersion = if (payload.has("schemaVersion")) payload.opt("schemaVersion") else null
    val schemaVersion = normalizeSchemaVersion(rawSchemaVersion)
    ensureSchemaCompatible(schemaVersion, "blocklist")

    val signedPayload = JSONObject()
      .put("version", version)
      .put("updatedAt", updatedAt)
      .put("domains", rawDomains)
    if (rawSchemaVersion != null && rawSchemaVersion != JSONObject.NULL) {
      signedPayload.put("schemaVersion", rawSchemaVersion)
    }

    return SignedBlocklistPayload(
      version = version,
      updatedAt = updatedAt,
      schemaVersion = schemaVersion,
      signature = signature,
      domains = parseDomainList(rawDomains),
      signedPayload = signedPayload
    )
  }

  private fun parseSignedPatternsPayload(payload: JSONObject): SignedPatternsPayload {
    val version = payload.optInt("version", -1)
    val updatedAt = payload.optLong("updatedAt", -1L)
    val signature = payload.optString("signature", "").trim()
    val rawPatterns = payload.opt("patterns")
    if (version < 0 || updatedAt < 0L || signature.isBlank() || rawPatterns !is JSONArray) {
      throw IllegalStateException("invalid_patterns_payload")
    }

    val rawSchemaVersion = if (payload.has("schemaVersion")) payload.opt("schemaVersion") else null
    val schemaVersion = normalizeSchemaVersion(rawSchemaVersion)
    ensureSchemaCompatible(schemaVersion, "patterns")

    val signedPayload = JSONObject()
      .put("version", version)
      .put("updatedAt", updatedAt)
      .put("patterns", rawPatterns)
    if (rawSchemaVersion != null && rawSchemaVersion != JSONObject.NULL) {
      signedPayload.put("schemaVersion", rawSchemaVersion)
    }

    return SignedPatternsPayload(
      version = version,
      updatedAt = updatedAt,
      schemaVersion = schemaVersion,
      signature = signature,
      patterns = parsePatternsArray(rawPatterns),
      signedPayload = signedPayload
    )
  }

  private fun verifySignatureWithServer(
    baseUrl: String,
    payload: JSONObject,
    signature: String
  ): Boolean {
    if (signature.isBlank()) return false
    val requestBody = JSONObject()
      .put("payload", payload)
      .put("signature", signature)

    return try {
      val response = postJson(baseUrl, "verify-signature", requestBody)
      response.optBoolean("ok", false)
    } catch (error: Exception) {
      if (BuildConfig.DEBUG) {
        Log.w(tag, "verify-signature unavailable in debug mode; skipping", error)
        true
      } else {
        false
      }
    }
  }

  @ReactMethod
  fun startVpn(promise: Promise) {
    try {
      val preflightIssue = evaluateHardeningPreflight()
      if (preflightIssue != null) {
        resolveResult(
          promise,
          "error",
          preflightIssue.first,
          preflightIssue.second
        )
        return
      }

      val intent = VpnService.prepare(reactApplicationContext)
      if (intent != null) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
          Log.w(tag, "VPN permission required but no activity")
          resolveResult(promise, "error", "activity_unavailable")
          return
        }
        if (pendingPromise != null) {
          Log.w(tag, "VPN permission request already in flight")
          resolveResult(promise, "error", "request_in_flight")
          return
        }
        pendingPromise = promise
        activity.startActivityForResult(intent, requestCodeVpn)
        Log.w(tag, "VPN permission required")
        return
      }

      val serviceIntent = Intent(reactApplicationContext, AntislotVpnService::class.java)
        .setAction(AntislotVpnService.ACTION_START)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        ContextCompat.startForegroundService(reactApplicationContext, serviceIntent)
      } else {
        reactApplicationContext.startService(serviceIntent)
      }

      Log.i(tag, "VPN start requested")
      resolveResult(promise, "running")
    } catch (e: Exception) {
      Log.e(tag, "VPN start failed", e)
      resolveResult(promise, "error", "start_failed")
    }
  }

  @ReactMethod
  fun stopVpn(promise: Promise) {
    try {
      val serviceIntent = Intent(reactApplicationContext, AntislotVpnService::class.java)
        .setAction(AntislotVpnService.ACTION_STOP)
      reactApplicationContext.startService(serviceIntent)
      Log.i(tag, "VPN stop requested")
      resolveResult(promise, "stopped")
    } catch (e: Exception) {
      Log.e(tag, "VPN stop failed", e)
      resolveResult(promise, "error", "stop_failed")
    }
  }

  @ReactMethod
  fun isVpnRunning(promise: Promise) {
    promise.resolve(AntislotVpnService.getStatus() == "running")
  }

  @ReactMethod
  fun syncBlocklist(apiUrl: String, promise: Promise) {
    val normalized = normalizeApiUrl(apiUrl)
    if (normalized.isBlank() || !isSecureApiUrl(normalized)) {
      Log.w(tag, "syncBlocklist rejected: invalid/insecure apiUrl")
      promise.resolve(false)
      return
    }

    Thread {
      try {
        val blocklistResponse = fetchJson(normalized, "blocklist")
        val patternsResponse = fetchJson(normalized, "patterns")

        val blocklistPayload = parseSignedBlocklistPayload(blocklistResponse)
        val patternsPayload = parseSignedPatternsPayload(patternsResponse)

        val blocklistVerified = verifySignatureWithServer(
          normalized,
          blocklistPayload.signedPayload,
          blocklistPayload.signature
        )
        val patternsVerified = verifySignatureWithServer(
          normalized,
          patternsPayload.signedPayload,
          patternsPayload.signature
        )
        if (!blocklistVerified) {
          throw IllegalStateException("blocklist_signature_invalid")
        }
        if (!patternsVerified) {
          throw IllegalStateException("patterns_signature_invalid")
        }

        val localBlocklistVersion = SharedConfigStore.loadBlocklistVersion(reactApplicationContext)
        val localPatternsVersion = SharedConfigStore.loadPatternsVersion(reactApplicationContext)
        val localBlocklistUpdatedAt = SharedConfigStore.loadBlocklistUpdatedAt(reactApplicationContext)
        val localPatternsUpdatedAt = SharedConfigStore.loadPatternsUpdatedAt(reactApplicationContext)

        val shouldUpdateBlocklist = when {
          localBlocklistVersion == null -> true
          blocklistPayload.version > localBlocklistVersion -> true
          blocklistPayload.version < localBlocklistVersion -> false
          else -> localBlocklistUpdatedAt == null || blocklistPayload.updatedAt >= localBlocklistUpdatedAt
        }
        val shouldUpdatePatterns = when {
          localPatternsVersion == null -> true
          patternsPayload.version > localPatternsVersion -> true
          patternsPayload.version < localPatternsVersion -> false
          else -> localPatternsUpdatedAt == null || patternsPayload.updatedAt >= localPatternsUpdatedAt
        }

        val syncedAt = System.currentTimeMillis()

        val wroteAnyConfig = when {
          shouldUpdateBlocklist && shouldUpdatePatterns -> {
            val saved = SharedConfigStore.saveSyncSnapshot(
              context = reactApplicationContext,
              domains = blocklistPayload.domains,
              rawPatternsJson = patternsPayload.patterns.toString(),
              blocklistVersion = blocklistPayload.version,
              blocklistUpdatedAt = blocklistPayload.updatedAt,
              patternsVersion = patternsPayload.version,
              patternsUpdatedAt = patternsPayload.updatedAt,
              syncedAt = syncedAt
            )
            if (!saved) {
              throw IllegalStateException("persist_snapshot_failed")
            }
            true
          }
          shouldUpdateBlocklist -> {
            val saved = SharedConfigStore.saveBlocklistSnapshot(
              context = reactApplicationContext,
              domains = blocklistPayload.domains,
              version = blocklistPayload.version,
              updatedAt = blocklistPayload.updatedAt,
              syncedAt = syncedAt
            )
            if (!saved) {
              throw IllegalStateException("persist_blocklist_failed")
            }
            true
          }
          shouldUpdatePatterns -> {
            val saved = SharedConfigStore.savePatternsSnapshot(
              context = reactApplicationContext,
              rawPatternsJson = patternsPayload.patterns.toString(),
              version = patternsPayload.version,
              updatedAt = patternsPayload.updatedAt,
              syncedAt = syncedAt
            )
            if (!saved) {
              throw IllegalStateException("persist_patterns_failed")
            }
            true
          }
          else -> {
            if (!SharedConfigStore.markBlocklistSynced(reactApplicationContext, syncedAt)) {
              throw IllegalStateException("persist_sync_marker_failed")
            }
            false
          }
        }

        if (wroteAnyConfig) {
          val revision = AntislotVpnService.notifyConfigUpdated()
          Log.i(
            tag,
            "syncBlocklist applied blocklistV=${blocklistPayload.version} patternsV=${patternsPayload.version} revision=$revision"
          )
        } else {
          Log.i(
            tag,
            "syncBlocklist skipped stale payload localBlocklistV=$localBlocklistVersion localPatternsV=$localPatternsVersion"
          )
        }

        promise.resolve(true)
      } catch (error: Exception) {
        Log.w(tag, "syncBlocklist failed", error)
        promise.resolve(false)
      }
    }.start()
  }

  @ReactMethod
  fun status(promise: Promise) {
    val current = AntislotVpnService.getStatus()
    promise.resolve(if (current == "running") "running" else "stopped")
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != requestCodeVpn) return
    val promise = pendingPromise
    pendingPromise = null

    if (promise == null) return
    if (resultCode == Activity.RESULT_OK) {
      try {
        val preflightIssue = evaluateHardeningPreflight()
        if (preflightIssue != null) {
          resolveResult(
            promise,
            "error",
            preflightIssue.first,
            preflightIssue.second
          )
          return
        }

        val serviceIntent = Intent(reactApplicationContext, AntislotVpnService::class.java)
          .setAction(AntislotVpnService.ACTION_START)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          ContextCompat.startForegroundService(reactApplicationContext, serviceIntent)
        } else {
          reactApplicationContext.startService(serviceIntent)
        }
        Log.i(tag, "VPN permission granted, start requested")
        resolveResult(promise, "running")
      } catch (e: Exception) {
        Log.e(tag, "VPN start failed after permission", e)
        resolveResult(promise, "error", "start_failed")
      }
    } else {
      Log.w(tag, "VPN permission denied")
      resolveResult(promise, "stopped", "permission_denied")
    }
  }

  override fun onNewIntent(intent: Intent) = Unit
}

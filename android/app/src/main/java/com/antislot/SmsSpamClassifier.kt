package com.antislot

import java.text.Normalizer
import java.util.Locale

data class SmsSpamResult(
  val isSpam: Boolean,
  val confidence: Double,
  val reasons: List<String>
)

object SmsSpamClassifier {
  private val urlRegex = Regex("(https?://|www\\.)", RegexOption.IGNORE_CASE)
  private val shortUrlRegex = Regex(
    "(bit\\.ly|tinyurl|goo\\.gl|t\\.co|ow\\.ly|is\\.gd|buff\\.ly|adf\\.ly|shorte\\.st|cutt\\.ly|rb\\.gy|lnk\\.bio)",
    RegexOption.IGNORE_CASE
  )
  private val suspiciousTldRegex = Regex("\\b[a-z0-9-]+\\.(xyz|top|click|shop|win|live|bet|vip|pw|sbs)\\b", RegexOption.IGNORE_CASE)
  private val urgencyRegex = Regex(
    "\\b(acil|hemen|simdi|son gun|limited|urgent|hurry|now|last chance)\\b",
    RegexOption.IGNORE_CASE
  )
  private val actionRegex = Regex(
    "\\b(tikla|click|uye ol|join|register|verify|dogrula|onayla|claim|redeem)\\b",
    RegexOption.IGNORE_CASE
  )
  private val moneyRegex = Regex(
    "(\\d+[\\.,]\\d+\\s*(tl|try|usd|eur|gbp)|[\\$\\u20AC\\u00A3]\\s*\\d+)",
    RegexOption.IGNORE_CASE
  )
  private val manyDigitsRegex = Regex("\\d{6,}")
  private val promoCodeRegex = Regex("(promo|kupon|code|kod)[\\s:=-]*[A-Z0-9]{4,}", RegexOption.IGNORE_CASE)
  private val otpRegex = Regex("\\b(kod|code|otp|sifre|password|dogrulama)\\b", RegexOption.IGNORE_CASE)
  private val otpNumberRegex = Regex("\\b\\d{4,8}\\b")

  private val transactionalHints = setOf(
    "otp",
    "dogrulama kodu",
    "verification code",
    "tek kullanimlik",
    "bankaniz",
    "bank",
    "invoice",
    "fatura",
    "kargo takip",
    "delivery update"
  )

  fun classify(sender: String, body: String, settings: SmsNativeSettings): SmsSpamResult {
    val rawBody = body.trim()
    if (rawBody.isEmpty()) {
      return SmsSpamResult(isSpam = false, confidence = 0.0, reasons = listOf("empty_message"))
    }

    val normalizedBody = normalizeText(rawBody)
    val compactBody = toCompact(normalizedBody)

    val keywordMatches = settings.keywords.filter { keyword ->
      keywordMatchesBody(keyword, normalizedBody, compactBody)
    }

    val hasKeyword = keywordMatches.isNotEmpty()
    val hasUrl = urlRegex.containsMatchIn(rawBody)
    val hasShortUrl = shortUrlRegex.containsMatchIn(rawBody)
    val hasSuspiciousTld = suspiciousTldRegex.containsMatchIn(rawBody)
    val hasUrgency = urgencyRegex.containsMatchIn(normalizedBody)
    val hasAction = actionRegex.containsMatchIn(normalizedBody)
    val hasMoney = moneyRegex.containsMatchIn(rawBody)
    val hasManyDigits = manyDigitsRegex.containsMatchIn(rawBody)
    val hasPromoCode = promoCodeRegex.containsMatchIn(rawBody)
    val senderSuspicious = isSenderSuspicious(sender)

    val hasTransactionalHint = transactionalHints.any { normalizedBody.contains(it) }
    val looksLikeOtp = otpRegex.containsMatchIn(normalizedBody) && otpNumberRegex.containsMatchIn(rawBody)

    var score = 0.0
    val reasons = mutableListOf<String>()

    if (keywordMatches.isNotEmpty()) {
      score += 0.50 + ((keywordMatches.size - 1) * 0.14)
      reasons += "matched_keywords:${keywordMatches.take(8).joinToString(",")}"
    }

    if (hasUrl) score += 0.16
    if (hasShortUrl) score += 0.28
    if (hasSuspiciousTld) score += 0.26
    if (hasUrgency) score += 0.10
    if (hasAction) score += 0.10
    if (hasMoney) score += 0.10
    if (hasManyDigits) score += 0.08
    if (hasPromoCode) score += 0.12
    if (senderSuspicious) score += 0.18

    if (hasKeyword && hasUrl) score += 0.28
    if (hasShortUrl && (hasKeyword || hasUrgency || senderSuspicious)) score += 0.24
    if (settings.strictMode && hasKeyword) score += 0.11

    val strongSignals = listOf(
      hasShortUrl,
      hasSuspiciousTld,
      hasUrgency,
      hasAction,
      hasMoney,
      hasManyDigits,
      hasPromoCode,
      senderSuspicious
    ).count { it }

    if (strongSignals >= 4) {
      score += if (settings.strictMode) 0.30 else 0.22
      reasons += "junk_signals:$strongSignals"
    }

    if (hasTransactionalHint && looksLikeOtp && !hasUrl && !hasShortUrl && !hasSuspiciousTld && keywordMatches.isEmpty()) {
      score -= if (settings.strictMode) 0.32 else 0.44
      reasons += "transactional_otp_hint"
    }

    val threshold = if (settings.strictMode) 0.34 else 0.46
    val confidence = score.coerceIn(0.0, 0.99)

    val decision = when {
      keywordMatches.size >= 2 -> confidence >= (threshold - 0.10)
      keywordMatches.size == 1 -> confidence >= threshold
      hasShortUrl && strongSignals >= 3 -> confidence >= 0.52
      hasUrl && strongSignals >= 5 -> confidence >= 0.44
      else -> false
    }

    val finalDecision = if (hasTransactionalHint && looksLikeOtp && !hasUrl && strongSignals <= 2) {
      false
    } else {
      decision
    }

    if (hasUrl) reasons += "has_url"
    if (hasShortUrl) reasons += "has_short_url"
    if (hasSuspiciousTld) reasons += "has_suspicious_tld"
    if (hasUrgency) reasons += "has_urgency"
    if (hasAction) reasons += "has_action"
    if (hasMoney) reasons += "has_money_pattern"
    if (hasManyDigits) reasons += "has_many_digits"
    if (hasPromoCode) reasons += "has_promo_code"
    if (senderSuspicious) reasons += "sender_suspicious"

    return SmsSpamResult(finalDecision, confidence, reasons.distinct())
  }

  private fun keywordMatchesBody(keyword: String, normalizedBody: String, compactBody: String): Boolean {
    val normalizedKeyword = normalizeText(keyword)
    if (normalizedKeyword.isBlank()) return false

    if (normalizedKeyword.contains(' ')) {
      if (normalizedBody.contains(normalizedKeyword)) return true
    } else {
      val boundaryRegex = Regex("\\b${Regex.escape(normalizedKeyword)}\\b")
      if (boundaryRegex.containsMatchIn(normalizedBody)) return true
    }

    val compactKeyword = toCompact(normalizedKeyword)
    if (compactKeyword.length >= 4 && compactBody.contains(compactKeyword)) {
      return true
    }

    // Handles obfuscated patterns such as b-a-h-i-s or b a h i s.
    if (normalizedKeyword.length >= 4 && !normalizedKeyword.contains(' ')) {
      val spread = normalizedKeyword.map { Regex.escape(it.toString()) }.joinToString("\\W*")
      val spreadRegex = Regex(spread, RegexOption.IGNORE_CASE)
      if (spreadRegex.containsMatchIn(normalizedBody)) return true
    }

    return false
  }

  private fun toCompact(text: String): String {
    return text.replace(Regex("[^a-z0-9]"), "")
  }

  private fun normalizeText(text: String): String {
    val lowered = text.lowercase(Locale.ROOT)
    val normalized = Normalizer.normalize(lowered, Normalizer.Form.NFD)
      .replace(Regex("\\p{InCombiningDiacriticalMarks}+"), "")

    return normalized
      .replace("\u0131", "i")
      .replace("\u015F", "s")
      .replace("\u011F", "g")
      .replace("\u00E7", "c")
      .replace("\u00F6", "o")
      .replace("\u00FC", "u")
      .replace('0', 'o')
      .replace(Regex("[1!|]"), "i")
      .replace('3', 'e')
      .replace(Regex("[4@]"), "a")
      .replace(Regex("[5$]"), "s")
      .replace('7', 't')
      .replace('8', 'b')
      .replace(Regex("[_\\-.]"), " ")
      .replace(Regex("[^a-z0-9\\s]"), " ")
      .replace(Regex("\\s+"), " ")
      .trim()
  }

  private fun isSenderSuspicious(sender: String): Boolean {
    if (sender.isBlank()) return false
    val clean = sender.trim()
    return Regex("^\\+?\\d{8,}$").matches(clean) ||
      Regex("^\\d{6,}$").matches(clean) ||
      Regex("^[A-Z0-9]{7,}$", RegexOption.IGNORE_CASE).matches(clean)
  }
}

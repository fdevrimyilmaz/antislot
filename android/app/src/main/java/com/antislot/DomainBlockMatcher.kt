package com.antislot

import java.util.Locale

class DomainBlockMatcher(
  domains: Set<String>,
  patterns: List<BlocklistPattern>,
  whitelist: Set<String>
) {
  private val blockDomains = domains.map(::normalizeDomain).filter { it.isNotEmpty() }.toSet()
  private val blockPatterns = patterns
    .mapNotNull { pattern ->
      val normalizedPattern = normalizePattern(pattern.pattern, pattern.type)
      if (normalizedPattern.isBlank()) {
        null
      } else {
        pattern.copy(pattern = normalizedPattern)
      }
    }
  private val allowDomains = whitelist.map(::normalizeDomain).filter { it.isNotEmpty() }.toSet()

  fun isBlocked(rawDomain: String): Boolean {
    val domain = normalizeDomain(rawDomain)
    if (domain.isBlank()) return false
    if (isWhitelisted(domain)) return false

    if (blockDomains.contains(domain)) return true
    if (blockDomains.any { blocked -> isSubdomainMatch(domain, blocked) }) return true

    for (pattern in blockPatterns) {
      if (matchesPattern(domain, pattern)) {
        return true
      }
    }

    return false
  }

  private fun isWhitelisted(domain: String): Boolean {
    if (allowDomains.contains(domain)) return true
    return allowDomains.any { allowed -> isSubdomainMatch(domain, allowed) }
  }

  private fun matchesPattern(domain: String, pattern: BlocklistPattern): Boolean {
    return when (pattern.type) {
      "exact" -> domain == pattern.pattern
      "subdomain" -> isSubdomainMatch(domain, pattern.pattern)
      "contains" -> domain.contains(pattern.pattern)
      "regex" -> {
        try {
          Regex(pattern.pattern, RegexOption.IGNORE_CASE).containsMatchIn(domain)
        } catch (_: Exception) {
          false
        }
      }
      else -> false
    }
  }

  private fun isSubdomainMatch(domain: String, parent: String): Boolean {
    if (domain == parent) return true
    return domain.endsWith(".$parent")
  }

  private fun normalizePattern(value: String, type: String): String {
    val trimmed = value.trim()
    if (trimmed.isEmpty()) return ""
    return if (type == "regex") {
      trimmed
    } else {
      normalizeDomain(trimmed)
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
}

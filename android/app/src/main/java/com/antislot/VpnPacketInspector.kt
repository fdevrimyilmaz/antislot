package com.antislot

import kotlin.math.min

enum class PacketAction {
  ALLOW,
  DROP,
  IGNORE
}

data class PacketInspectionResult(
  val action: PacketAction,
  val reason: String? = null,
  val detail: String? = null
)

object VpnPacketInspector {
  private const val IP_PROTOCOL_TCP = 6
  private const val IP_PROTOCOL_UDP = 17

  private const val PORT_DNS = 53
  private const val PORT_HTTPS = 443
  private const val PORT_DOT = 853

  private val dohHostHints = setOf(
    "dns.google",
    "cloudflare-dns.com",
    "mozilla.cloudflare-dns.com",
    "dns.quad9.net",
    "dns.adguard.com",
    "dns.nextdns.io",
    "doh.opendns.com",
    "dns.familyshield.opendns.com",
    "doh.cleanbrowsing.org"
  )

  fun inspect(
    packet: ByteArray,
    length: Int,
    matcher: DomainBlockMatcher,
    hardening: BlockerHardeningNativeSettings
  ): PacketInspectionResult {
    if (length < 20) {
      return PacketInspectionResult(PacketAction.IGNORE)
    }

    val version = packet[0].toInt().ushr(4) and 0x0F
    if (version != 4) {
      return PacketInspectionResult(PacketAction.IGNORE)
    }

    val ipHeaderLength = (packet[0].toInt() and 0x0F) * 4
    if (ipHeaderLength < 20 || length < ipHeaderLength + 8) {
      return PacketInspectionResult(PacketAction.IGNORE)
    }

    val protocol = packet[9].toInt() and 0xFF
    return when (protocol) {
      IP_PROTOCOL_UDP -> inspectUdp(packet, length, ipHeaderLength, matcher, hardening)
      IP_PROTOCOL_TCP -> inspectTcp(packet, length, ipHeaderLength, hardening)
      else -> PacketInspectionResult(PacketAction.IGNORE)
    }
  }

  private fun inspectUdp(
    packet: ByteArray,
    length: Int,
    ipHeaderLength: Int,
    matcher: DomainBlockMatcher,
    hardening: BlockerHardeningNativeSettings
  ): PacketInspectionResult {
    if (length < ipHeaderLength + 8) {
      return PacketInspectionResult(PacketAction.IGNORE)
    }

    val destinationPort = readUInt16(packet, ipHeaderLength + 2)

    if (destinationPort == PORT_DOT && hardening.blockDot) {
      return PacketInspectionResult(
        action = PacketAction.DROP,
        reason = "dot_packet",
        detail = "UDP/853 packet blocked by hardening policy."
      )
    }

    if (destinationPort == PORT_HTTPS && hardening.blockQuic) {
      return PacketInspectionResult(
        action = PacketAction.DROP,
        reason = "quic_packet",
        detail = "UDP/443 packet blocked by hardening policy."
      )
    }

    if (destinationPort == PORT_DNS) {
      val dnsOffset = ipHeaderLength + 8
      val dnsLength = length - dnsOffset
      val queriedDomain = parseDnsQuestionDomain(packet, dnsOffset, dnsLength)
      if (!queriedDomain.isNullOrBlank() && matcher.isBlocked(queriedDomain)) {
        return PacketInspectionResult(
          action = PacketAction.DROP,
          reason = "blocked_domain",
          detail = queriedDomain
        )
      }
    }

    return PacketInspectionResult(PacketAction.ALLOW)
  }

  private fun inspectTcp(
    packet: ByteArray,
    length: Int,
    ipHeaderLength: Int,
    hardening: BlockerHardeningNativeSettings
  ): PacketInspectionResult {
    if (length < ipHeaderLength + 20) {
      return PacketInspectionResult(PacketAction.IGNORE)
    }

    val destinationPort = readUInt16(packet, ipHeaderLength + 2)

    if (destinationPort == PORT_DOT && hardening.blockDot) {
      return PacketInspectionResult(
        action = PacketAction.DROP,
        reason = "dot_packet",
        detail = "TCP/853 packet blocked by hardening policy."
      )
    }

    if (destinationPort == PORT_HTTPS && hardening.blockDoh) {
      val tcpHeaderLength = ((packet[ipHeaderLength + 12].toInt().ushr(4)) and 0x0F) * 4
      val payloadOffset = ipHeaderLength + tcpHeaderLength
      if (payloadOffset in 0 until length) {
        val payloadSize = length - payloadOffset
        val hostHint = detectDohHostHint(packet, payloadOffset, payloadSize)
        if (hostHint != null) {
          return PacketInspectionResult(
            action = PacketAction.DROP,
            reason = "doh_hint",
            detail = hostHint
          )
        }
      }
    }

    return PacketInspectionResult(PacketAction.ALLOW)
  }

  private fun detectDohHostHint(
    packet: ByteArray,
    offset: Int,
    size: Int
  ): String? {
    if (size <= 0) return null
    val safeSize = min(size, 2048)
    val snippet = String(packet, offset, safeSize, Charsets.ISO_8859_1).lowercase()
    for (host in dohHostHints) {
      if (snippet.contains(host)) {
        return host
      }
    }
    return null
  }

  private fun parseDnsQuestionDomain(packet: ByteArray, dnsOffset: Int, dnsLength: Int): String? {
    if (dnsLength < 12) return null
    val questionCount = readUInt16(packet, dnsOffset + 4)
    if (questionCount <= 0) return null

    var pointer = dnsOffset + 12
    val limit = dnsOffset + dnsLength
    val labels = mutableListOf<String>()

    while (pointer < limit) {
      val labelLength = packet[pointer].toInt() and 0xFF
      pointer += 1
      if (labelLength == 0) {
        break
      }
      if (labelLength > 63 || pointer + labelLength > limit) {
        return null
      }

      val label = String(packet, pointer, labelLength, Charsets.US_ASCII)
      labels += label
      pointer += labelLength
    }

    if (labels.isEmpty()) return null
    return labels.joinToString(".").lowercase()
  }

  private fun readUInt16(packet: ByteArray, offset: Int): Int {
    if (offset < 0 || offset + 1 >= packet.size) return 0
    return ((packet[offset].toInt() and 0xFF) shl 8) or (packet[offset + 1].toInt() and 0xFF)
  }
}

package com.antislot

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.FileOutputStream
import java.io.FileInputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.SocketTimeoutException
import java.util.concurrent.atomic.AtomicLong
import kotlin.math.min

class AntislotVpnService : VpnService() {

  private val tag = "AntislotVpnService"
  private var vpnInterface: ParcelFileDescriptor? = null
  @Volatile private var packetLoopRunning = false
  @Volatile private var packetLoopThread: Thread? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START -> startVpn()
      ACTION_STOP -> stopVpn()
      else -> Log.w(tag, "Unknown action: ${intent?.action}")
    }
    return START_STICKY
  }

  override fun onDestroy() {
    super.onDestroy()
    if (vpnInterface != null) {
      stopVpn()
    }
  }

  private fun startVpn() {
    if (vpnInterface != null) {
      updateStatus("running")
      return
    }

    try {
      startForeground(NOTIFICATION_ID, buildNotification())

      val hardening = SharedConfigStore.loadBlockerHardening(this)
      val interceptTargets = resolveInterceptTargets(hardening)

      val builder = Builder()
        .setSession("Antislot VPN")
        .setMtu(1500)
        .addAddress(VPN_TUN_ADDRESS, 32)
        .addRoute(VPN_TUN_ADDRESS, 32)

      interceptTargets.forEach { ip ->
        try {
          builder.addRoute(ip, 32)
        } catch (_: IllegalArgumentException) {
          // Ignore malformed IP entries from dynamic discovery.
        }
      }

      vpnInterface = builder.establish()
      if (vpnInterface == null) {
        updateStatus("error", "establish_failed")
        Log.e(tag, "VPN establish failed")
      } else {
        startPacketInspectionLoop()
        updateStatus("running")
        Log.i(tag, "VPN started with ${interceptTargets.size} intercept routes")
      }
    } catch (e: Exception) {
      updateStatus("error", e.message)
      Log.e(tag, "VPN start error", e)
    }
  }

  private fun stopVpn() {
    try {
      stopPacketInspectionLoop()
      vpnInterface?.close()
    } catch (e: Exception) {
      Log.w(tag, "VPN close error", e)
    } finally {
      vpnInterface = null
      updateStatus("stopped")
      stopForeground(true)
      stopSelf()
      Log.i(tag, "VPN stopped")
    }
  }

  private fun startPacketInspectionLoop() {
    val tun = vpnInterface ?: return
    if (packetLoopRunning) return

    packetLoopRunning = true
    packetLoopThread = Thread {
      runPacketInspectionLoop(tun)
    }.apply {
      name = "antislot-vpn-inspector"
      isDaemon = true
      start()
    }
  }

  private fun stopPacketInspectionLoop() {
    packetLoopRunning = false
    packetLoopThread?.interrupt()
    packetLoopThread = null
  }

  private fun runPacketInspectionLoop(tun: ParcelFileDescriptor) {
    val input = FileInputStream(tun.fileDescriptor)
    val output = FileOutputStream(tun.fileDescriptor)
    val buffer = ByteArray(32767)

    var matcher = buildDomainMatcher()
    var hardening = SharedConfigStore.loadBlockerHardening(this)
    var lastReloadAt = System.currentTimeMillis()
    var observedConfigRevision = getConfigRevision()
    var lastDropLogAt = 0L
    val dnsSocket = DatagramSocket().apply {
      soTimeout = DNS_RELAY_TIMEOUT_MS
      protect(this)
    }

    try {
      while (packetLoopRunning) {
        val read = input.read(buffer)
        if (read <= 0) {
          continue
        }

        val now = System.currentTimeMillis()
        val currentConfigRevision = getConfigRevision()
        if (
          currentConfigRevision != observedConfigRevision ||
          now - lastReloadAt >= CONFIG_RELOAD_INTERVAL_MS
        ) {
          matcher = buildDomainMatcher()
          hardening = SharedConfigStore.loadBlockerHardening(this)
          lastReloadAt = now
          observedConfigRevision = currentConfigRevision
        }

        val dnsQuery = parseDnsQueryPacket(buffer, read)
        if (dnsQuery != null) {
          val domain = dnsQuery.queriedDomain
          if (!domain.isNullOrBlank() && matcher.isBlocked(domain)) {
            val dnsResponse = buildNxDomainResponse(dnsQuery.dnsPayload)
            if (dnsResponse != null) {
              val ipPacket = buildUdpIpv4Packet(
                sourceIp = dnsQuery.destinationIp,
                destinationIp = dnsQuery.sourceIp,
                sourcePort = dnsQuery.destinationPort,
                destinationPort = dnsQuery.sourcePort,
                payload = dnsResponse
              )
              output.write(ipPacket)
            }

            if (hardening.tamperAlerts && now - lastDropLogAt >= 1500L) {
              Log.w(tag, "dns_blocked domain=$domain")
              lastDropLogAt = now
            }
            continue
          }

          val relayedResponse = relayDnsQuery(dnsSocket, dnsQuery.dnsPayload)
          if (relayedResponse != null) {
            val ipPacket = buildUdpIpv4Packet(
              sourceIp = dnsQuery.destinationIp,
              destinationIp = dnsQuery.sourceIp,
              sourcePort = dnsQuery.destinationPort,
              destinationPort = dnsQuery.sourcePort,
              payload = relayedResponse
            )
            output.write(ipPacket)
            continue
          }

          if (hardening.strictMode) {
            val failResponse = buildServFailResponse(dnsQuery.dnsPayload)
            if (failResponse != null) {
              val ipPacket = buildUdpIpv4Packet(
                sourceIp = dnsQuery.destinationIp,
                destinationIp = dnsQuery.sourceIp,
                sourcePort = dnsQuery.destinationPort,
                destinationPort = dnsQuery.sourcePort,
                payload = failResponse
              )
              output.write(ipPacket)
            }
          }
          continue
        }

        val inspection = VpnPacketInspector.inspect(buffer, read, matcher, hardening)
        if (inspection.action == PacketAction.DROP && hardening.tamperAlerts) {
          if (now - lastDropLogAt >= 1500L) {
            Log.w(
              tag,
              "packet_dropped reason=${inspection.reason ?: "unknown"} detail=${inspection.detail ?: "-"}"
            )
            lastDropLogAt = now
          }
        }
      }
    } catch (error: Exception) {
      if (packetLoopRunning) {
        Log.w(tag, "Packet inspection loop stopped unexpectedly", error)
      }
    } finally {
      try {
        dnsSocket.close()
      } catch (_: Exception) {
      }
      try {
        input.close()
      } catch (_: Exception) {
      }
      try {
        output.close()
      } catch (_: Exception) {
      }
    }
  }

  private fun buildDomainMatcher(): DomainBlockMatcher {
    val domains = SharedConfigStore.loadBlocklistDomains(this)
    val patterns = SharedConfigStore.loadBlocklistPatterns(this)
    val whitelist = SharedConfigStore.loadWhitelistDomains(this)
    return DomainBlockMatcher(domains, patterns, whitelist)
  }

  private fun resolveInterceptTargets(hardening: BlockerHardeningNativeSettings): Set<String> {
    val targets = LinkedHashSet<String>()
    COMMON_DNS_IPV4.forEach { targets += it }

    if (hardening.blockDoh || hardening.blockQuic) {
      resolveDohProviderIps().forEach { targets += it }
    }

    if (hardening.blockDot) {
      DOT_RESOLVER_IPV4.forEach { targets += it }
    }

    return targets
  }

  private fun resolveDohProviderIps(): Set<String> {
    val resolved = LinkedHashSet<String>()
    for (host in DOH_HOST_HINTS) {
      try {
        val addresses = InetAddress.getAllByName(host)
        for (address in addresses) {
          val raw = address.hostAddress ?: continue
          if (isIpv4Address(raw)) {
            resolved += raw
          }
        }
      } catch (_: Exception) {
      }
    }
    return resolved
  }

  private fun parseDnsQueryPacket(packet: ByteArray, length: Int): DnsQueryPacket? {
    if (length < 28) return null
    val version = packet[0].toInt().ushr(4) and 0x0F
    if (version != 4) return null

    val ipHeaderLength = (packet[0].toInt() and 0x0F) * 4
    if (ipHeaderLength < 20 || length < ipHeaderLength + 8) return null

    val protocol = packet[9].toInt() and 0xFF
    if (protocol != 17) return null // UDP only

    val sourcePort = readUInt16(packet, ipHeaderLength)
    val destinationPort = readUInt16(packet, ipHeaderLength + 2)
    if (destinationPort != 53) return null

    val udpLength = readUInt16(packet, ipHeaderLength + 4)
    if (udpLength < 8) return null

    val payloadOffset = ipHeaderLength + 8
    val payloadLength = min(length - payloadOffset, udpLength - 8)
    if (payloadLength <= 12 || payloadOffset + payloadLength > length) return null

    val dnsPayload = packet.copyOfRange(payloadOffset, payloadOffset + payloadLength)
    val domain = parseDnsQuestionDomain(dnsPayload)

    return DnsQueryPacket(
      sourceIp = readIpv4AsInt(packet, 12),
      destinationIp = readIpv4AsInt(packet, 16),
      sourcePort = sourcePort,
      destinationPort = destinationPort,
      dnsPayload = dnsPayload,
      queriedDomain = domain
    )
  }

  private fun relayDnsQuery(socket: DatagramSocket, payload: ByteArray): ByteArray? {
    for (upstream in DNS_UPSTREAM_IPV4) {
      try {
        val target = InetAddress.getByName(upstream)
        val requestPacket = DatagramPacket(payload, payload.size, target, 53)
        socket.send(requestPacket)

        val responseBuffer = ByteArray(4096)
        val responsePacket = DatagramPacket(responseBuffer, responseBuffer.size)
        socket.receive(responsePacket)
        if (responsePacket.length > 0) {
          return responseBuffer.copyOf(responsePacket.length)
        }
      } catch (_: SocketTimeoutException) {
      } catch (_: Exception) {
      }
    }
    return null
  }

  private fun buildNxDomainResponse(query: ByteArray): ByteArray? {
    val questionEnd = findDnsQuestionEnd(query) ?: return null
    val response = ByteArray(questionEnd)
    System.arraycopy(query, 0, response, 0, questionEnd)
    response[2] = (0x80 or (query[2].toInt() and 0x01)).toByte()
    response[3] = 0x83.toByte() // RA + NXDOMAIN
    response[6] = 0
    response[7] = 0
    response[8] = 0
    response[9] = 0
    response[10] = 0
    response[11] = 0
    return response
  }

  private fun buildServFailResponse(query: ByteArray): ByteArray? {
    val questionEnd = findDnsQuestionEnd(query) ?: return null
    val response = ByteArray(questionEnd)
    System.arraycopy(query, 0, response, 0, questionEnd)
    response[2] = (0x80 or (query[2].toInt() and 0x01)).toByte()
    response[3] = 0x82.toByte() // RA + SERVFAIL
    response[6] = 0
    response[7] = 0
    response[8] = 0
    response[9] = 0
    response[10] = 0
    response[11] = 0
    return response
  }

  private fun findDnsQuestionEnd(dnsPayload: ByteArray): Int? {
    if (dnsPayload.size < 12) return null
    val questionCount = readUInt16(dnsPayload, 4)
    if (questionCount <= 0) return null

    var pointer = 12
    var questionsLeft = questionCount
    while (questionsLeft > 0) {
      while (pointer < dnsPayload.size) {
        val labelLength = dnsPayload[pointer].toInt() and 0xFF
        pointer += 1
        if (labelLength == 0) break
        if (labelLength > 63 || pointer + labelLength > dnsPayload.size) return null
        pointer += labelLength
      }
      if (pointer + 4 > dnsPayload.size) return null
      pointer += 4
      questionsLeft -= 1
    }
    return pointer
  }

  private fun parseDnsQuestionDomain(dnsPayload: ByteArray): String? {
    if (dnsPayload.size < 12) return null
    val questionCount = readUInt16(dnsPayload, 4)
    if (questionCount <= 0) return null

    var pointer = 12
    val labels = mutableListOf<String>()
    while (pointer < dnsPayload.size) {
      val labelLength = dnsPayload[pointer].toInt() and 0xFF
      pointer += 1
      if (labelLength == 0) break
      if (labelLength > 63 || pointer + labelLength > dnsPayload.size) return null
      labels += String(dnsPayload, pointer, labelLength, Charsets.US_ASCII)
      pointer += labelLength
    }
    if (labels.isEmpty()) return null
    return labels.joinToString(".").lowercase()
  }

  private fun buildUdpIpv4Packet(
    sourceIp: Int,
    destinationIp: Int,
    sourcePort: Int,
    destinationPort: Int,
    payload: ByteArray
  ): ByteArray {
    val ipHeaderLength = 20
    val udpHeaderLength = 8
    val totalLength = ipHeaderLength + udpHeaderLength + payload.size
    val packet = ByteArray(totalLength)

    packet[0] = 0x45 // IPv4 + header length 20
    packet[1] = 0
    writeUInt16(packet, 2, totalLength)
    writeUInt16(packet, 4, 0)
    writeUInt16(packet, 6, 0)
    packet[8] = 64
    packet[9] = 17 // UDP
    writeUInt16(packet, 10, 0)
    writeIpv4(packet, 12, sourceIp)
    writeIpv4(packet, 16, destinationIp)

    writeUInt16(packet, 20, sourcePort)
    writeUInt16(packet, 22, destinationPort)
    writeUInt16(packet, 24, udpHeaderLength + payload.size)
    writeUInt16(packet, 26, 0) // UDP checksum optional on IPv4

    System.arraycopy(payload, 0, packet, 28, payload.size)

    val checksum = computeIpv4HeaderChecksum(packet, 0, ipHeaderLength)
    writeUInt16(packet, 10, checksum)
    return packet
  }

  private fun computeIpv4HeaderChecksum(packet: ByteArray, offset: Int, length: Int): Int {
    var sum = 0L
    var i = offset
    while (i < offset + length) {
      if (i == offset + 10) {
        i += 2
        continue
      }
      val word = readUInt16(packet, i)
      sum += word.toLong()
      while ((sum and 0xFFFF0000L) != 0L) {
        sum = (sum and 0xFFFFL) + (sum ushr 16)
      }
      i += 2
    }
    return sum.inv().toInt() and 0xFFFF
  }

  private fun isIpv4Address(value: String): Boolean {
    val parts = value.split(".")
    if (parts.size != 4) return false
    return parts.all { part ->
      val parsed = part.toIntOrNull() ?: return@all false
      parsed in 0..255
    }
  }

  private fun readIpv4AsInt(packet: ByteArray, offset: Int): Int {
    return ((packet[offset].toInt() and 0xFF) shl 24) or
      ((packet[offset + 1].toInt() and 0xFF) shl 16) or
      ((packet[offset + 2].toInt() and 0xFF) shl 8) or
      (packet[offset + 3].toInt() and 0xFF)
  }

  private fun writeIpv4(packet: ByteArray, offset: Int, value: Int) {
    packet[offset] = (value ushr 24).toByte()
    packet[offset + 1] = (value ushr 16).toByte()
    packet[offset + 2] = (value ushr 8).toByte()
    packet[offset + 3] = value.toByte()
  }

  private fun readUInt16(packet: ByteArray, offset: Int): Int {
    if (offset < 0 || offset + 1 >= packet.size) return 0
    return ((packet[offset].toInt() and 0xFF) shl 8) or (packet[offset + 1].toInt() and 0xFF)
  }

  private fun writeUInt16(packet: ByteArray, offset: Int, value: Int) {
    packet[offset] = ((value ushr 8) and 0xFF).toByte()
    packet[offset + 1] = (value and 0xFF).toByte()
  }

  private fun buildNotification(): Notification {
    createNotificationChannel()
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val pendingIntent = if (launchIntent != null) {
      PendingIntent.getActivity(
        this,
        0,
        launchIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or pendingIntentImmutableFlag()
      )
    } else {
      null
    }

    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Antislot VPN")
      .setContentText("Koruma etkin")
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setOngoing(true)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
    if (pendingIntent != null) {
      builder.setContentIntent(pendingIntent)
    }

    return builder.build()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Antislot VPN",
        NotificationManager.IMPORTANCE_LOW
      )
      val manager = getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
    }
  }

  private fun pendingIntentImmutableFlag(): Int {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_IMMUTABLE
    } else {
      0
    }
  }

  companion object {
    const val ACTION_START = "com.antislot.vpn.START"
    const val ACTION_STOP = "com.antislot.vpn.STOP"
    private const val CHANNEL_ID = "antislot_vpn"
    private const val NOTIFICATION_ID = 4101
    private const val VPN_TUN_ADDRESS = "10.7.0.2"
    private const val DNS_RELAY_TIMEOUT_MS = 1500
    private const val CONFIG_RELOAD_INTERVAL_MS = 5000L

    private val COMMON_DNS_IPV4 = listOf(
      "1.1.1.1",
      "1.0.0.1",
      "8.8.8.8",
      "8.8.4.4",
      "9.9.9.9",
      "149.112.112.112",
      "208.67.222.222",
      "208.67.220.220",
      "94.140.14.14",
      "94.140.15.15",
      "76.76.2.0",
      "76.76.10.0"
    )

    private val DOT_RESOLVER_IPV4 = listOf(
      "1.1.1.1",
      "1.0.0.1",
      "8.8.8.8",
      "8.8.4.4",
      "9.9.9.9",
      "149.112.112.112",
      "94.140.14.14",
      "94.140.15.15"
    )

    private val DNS_UPSTREAM_IPV4 = listOf(
      "9.9.9.9",
      "1.1.1.1",
      "8.8.8.8"
    )

    private val DOH_HOST_HINTS = listOf(
      "dns.google",
      "cloudflare-dns.com",
      "mozilla.cloudflare-dns.com",
      "dns.quad9.net",
      "dns.adguard.com",
      "dns.nextdns.io",
      "doh.opendns.com",
      "doh.cleanbrowsing.org"
    )

    private val configRevision = AtomicLong(0L)

    @Volatile private var status: String = "stopped"
    @Volatile private var lastError: String? = null

    fun getStatus(): String = status

    fun notifyConfigUpdated(): Long {
      return configRevision.incrementAndGet()
    }

    private fun getConfigRevision(): Long = configRevision.get()

    fun updateStatus(newStatus: String, error: String? = null) {
      status = newStatus
      lastError = error
    }
  }

  private data class DnsQueryPacket(
    val sourceIp: Int,
    val destinationIp: Int,
    val sourcePort: Int,
    val destinationPort: Int,
    val dnsPayload: ByteArray,
    val queriedDomain: String?
  )
}

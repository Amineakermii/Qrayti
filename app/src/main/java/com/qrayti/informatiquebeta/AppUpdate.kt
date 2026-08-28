package com.qrayti.informatiquebeta

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

data class AppUpdate(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val size: Long,
    val sha256: String,
    val releasedAt: String,
    val notes: List<String>,
    val mandatory: Boolean,
)

class UpdateRepository {
    suspend fun check(): Result<AppUpdate?> = withContext(Dispatchers.IO) {
        runCatching {
            val connection = URL("${BuildConfig.BASE_URL}/api/android-update").openConnection() as HttpURLConnection
            connection.apply {
                requestMethod = "GET"
                connectTimeout = 6_000
                readTimeout = 8_000
                useCaches = false
                setRequestProperty("Accept", "application/json")
                setRequestProperty("User-Agent", "Qrayti-Android/${BuildConfig.VERSION_NAME}")
            }
            try {
                check(connection.responseCode in 200..299) { "HTTP ${connection.responseCode}" }
                val json = JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
                val code = json.getInt("versionCode")
                if (code <= BuildConfig.VERSION_CODE) null else AppUpdate(
                    versionCode = code,
                    versionName = json.getString("versionName"),
                    apkUrl = json.getString("apkUrl").absoluteQraytiUrl(),
                    size = json.optLong("size"),
                    sha256 = json.optString("sha256").uppercase(),
                    releasedAt = json.optString("releasedAt"),
                    notes = buildList {
                        val array = json.optJSONArray("notes")
                        if (array != null) for (index in 0 until array.length()) add(array.optString(index))
                    }.filter(String::isNotBlank),
                    mandatory = json.optBoolean("mandatory", false),
                )
            } finally {
                connection.disconnect()
            }
        }
    }
}

class AppUpdateManager(private val context: Context) {
    suspend fun download(update: AppUpdate, onProgress: (Float) -> Unit): Result<File> = withContext(Dispatchers.IO) {
        runCatching {
            val directory = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                ?.resolve("updates")?.apply { mkdirs() }
                ?: error("Download storage unavailable")
            val target = directory.resolve("Qrayti-${update.versionName}.apk")
            val temporary = directory.resolve("${target.name}.part")
            target.delete();temporary.delete()
            var connection:HttpURLConnection?=null
            try {
                connection=(URL(update.apkUrl).openConnection() as HttpURLConnection).apply {
                    requestMethod="GET"
                    instanceFollowRedirects=true
                    connectTimeout=15_000
                    readTimeout=180_000
                    useCaches=false
                    setRequestProperty("Accept","application/vnd.android.package-archive, application/octet-stream")
                    setRequestProperty("Accept-Encoding","identity")
                    setRequestProperty("Cache-Control","no-cache")
                    setRequestProperty("User-Agent","Qrayti-Android/${BuildConfig.VERSION_NAME}")
                }
                check(connection.responseCode in 200..299){"HTTP ${connection.responseCode}"}
                val total=connection.contentLengthLong.takeIf{it>0}?:update.size.takeIf{it>0}?:-1L
                var downloaded=0L
                var lastUpdate=0L
                connection.inputStream.buffered().use { input -> temporary.outputStream().buffered().use { output ->
                    val buffer=ByteArray(64*1024)
                    while(true){
                        val count=input.read(buffer);if(count<0)break
                        output.write(buffer,0,count);downloaded+=count
                        val now=System.currentTimeMillis()
                        if(now-lastUpdate>160){withContext(Dispatchers.Main){onProgress(if(total>0)(downloaded.toFloat()/total).coerceIn(0f,.99f) else 0f)};lastUpdate=now}
                    }
                }}
                check(temporary.isFile&&temporary.length()>0){"Downloaded APK is empty"}
                if(total>0)check(temporary.length()==total){"Incomplete APK download"}
                check(temporary.renameTo(target)){"Could not finalize APK"}
            } catch(error:Throwable) {
                temporary.delete();throw error
            } finally {
                connection?.disconnect()
            }
            check(target.isFile && target.length() > 0) { "Downloaded APK is missing" }
            if (update.sha256.isNotBlank()) {
                check(target.sha256().equals(update.sha256, ignoreCase = true)) { "APK checksum mismatch" }
            }
            withContext(Dispatchers.Main){onProgress(1f)}
            target
        }
    }

    fun canInstallPackages():Boolean = Build.VERSION.SDK_INT < Build.VERSION_CODES.O || context.packageManager.canRequestPackageInstalls()

    fun requestInstallPermission() {
        if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.O){
            context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        }
    }

    fun install(apk: File):Boolean {
        if(!canInstallPackages()){requestInstallPermission();return false}
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", apk)
        val intent = Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, "application/vnd.android.package-archive")
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        return true
    }
}

private fun String.absoluteQraytiUrl(): String =
    if (startsWith("http://") || startsWith("https://")) this
    else "${BuildConfig.BASE_URL}/${trimStart('/')}"

private fun File.sha256(): String {
    val digest = MessageDigest.getInstance("SHA-256")
    inputStream().buffered().use { input ->
        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
        while (true) {
            val count = input.read(buffer)
            if (count <= 0) break
            digest.update(buffer, 0, count)
        }
    }
    return digest.digest().joinToString("") { "%02X".format(it) }
}

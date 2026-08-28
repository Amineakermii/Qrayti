package com.qrayti.informatiquebeta

import android.content.Context
import android.os.Environment
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

class DownloadController(private val context: Context) {
    private val scope=CoroutineScope(SupervisorJob()+Dispatchers.IO)
    private val jobs=ConcurrentHashMap<String,Job>()
    private val states=ConcurrentHashMap<String,DownloadState>()
    private val ids=AtomicLong(System.currentTimeMillis())

    fun localFile(file: CourseFile): File {
        val ext = file.extension.ifBlank { file.kind.ifBlank { "bin" } }
        val safeId = file.id.replace(Regex("[^a-zA-Z0-9._-]"), "_").take(120)
        return File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "qrayti/$safeId.$ext")
    }

    fun isDownloaded(file: CourseFile): Boolean = localFile(file).let { it.isFile && it.length() > 0 }

    fun enqueue(file: CourseFile): Long {
        if(isDownloaded(file)){states[file.id]=DownloadState.Done(localFile(file));return ids.incrementAndGet()}
        if(jobs[file.id]?.isActive==true)return ids.incrementAndGet()
        val out=localFile(file)
        val temporary=File(out.parentFile,"${out.name}.part")
        out.parentFile?.mkdirs();temporary.delete()
        states[file.id]=DownloadState.Downloading(0f)
        jobs[file.id]=scope.launch{
            var connection:HttpURLConnection?=null
            try{
                connection=(URL(file.saveUrl).openConnection() as HttpURLConnection).apply{
                    requestMethod="GET";instanceFollowRedirects=true;connectTimeout=12_000;readTimeout=120_000;useCaches=false
                    setRequestProperty("Accept","*/*");setRequestProperty("Accept-Encoding","identity");setRequestProperty("Cache-Control","no-cache")
                    setRequestProperty("User-Agent","Qrayti-Android/${BuildConfig.VERSION_NAME}")
                }
                val code=connection.responseCode
                check(code in 200..299){"HTTP $code"}
                val responseLength=connection.contentLengthLong.takeIf{it>0}
                val total=responseLength?:file.size.takeIf{it>0}?:-1L
                connection.inputStream.buffered().use{input->temporary.outputStream().buffered().use{output->
                    val buffer=ByteArray(64*1024);var downloaded=0L;var lastUpdate=0L
                    while(true){
                        val count=input.read(buffer);if(count<0)break
                        output.write(buffer,0,count);downloaded+=count
                        val now=System.currentTimeMillis()
                        if(now-lastUpdate>180){states[file.id]=DownloadState.Downloading(if(total>0)(downloaded.toFloat()/total).coerceIn(0f,.99f) else -1f);lastUpdate=now}
                    }
                }}
                check(temporary.isFile&&temporary.length()>0){"Empty file"}
                if(responseLength!=null)check(temporary.length()==responseLength){"Incomplete file"}
                check(temporary.hasExpectedHeader(file.extension)){"Invalid file response"}
                if(out.exists())out.delete()
                check(temporary.renameTo(out)){"Could not finish file"}
                states[file.id]=DownloadState.Done(out)
            }catch(error:Throwable){temporary.delete();states[file.id]=DownloadState.Failed(error.message?.take(90).orEmpty())}
            finally{connection?.disconnect();jobs.remove(file.id)}
        }
        return ids.incrementAndGet()
    }

    fun status(file: CourseFile): DownloadState {
        if(isDownloaded(file))return DownloadState.Done(localFile(file))
        return states[file.id]?:DownloadState.None
    }

    fun remove(file: CourseFile) {
        jobs.remove(file.id)?.cancel()
        val local=localFile(file);File(local.parentFile,"${local.name}.part").delete();local.delete();states.remove(file.id)
    }

    fun downloadedCount(): Int = downloadDirectory()?.listFiles()?.count { it.isFile && it.length() > 0 && !it.name.endsWith(".part") } ?: 0
    fun downloadedBytes(): Long = downloadDirectory()?.listFiles()?.sumOf { if (it.isFile&&!it.name.endsWith(".part")) it.length() else 0L } ?: 0L
    private fun downloadDirectory(): File? = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)?.resolve("qrayti")
    fun close()=scope.cancel()
}

private fun File.hasExpectedHeader(extension:String):Boolean{
    val header=inputStream().use{input->ByteArray(8).also{input.read(it)}}
    fun starts(vararg bytes:Int)=bytes.indices.all{header[it].toInt()and 0xFF==bytes[it]}
    return when(extension){
        "pdf"->starts(0x25,0x50,0x44,0x46)
        "docx","pptx","ppsx","xlsx","zip"->starts(0x50,0x4B)
        "doc","ppt","pps","xls"->starts(0xD0,0xCF,0x11,0xE0)||starts(0x7B,0x5C,0x72,0x74,0x66)
        "png"->starts(0x89,0x50,0x4E,0x47)
        "jpg","jpeg"->starts(0xFF,0xD8)
        "gif"->starts(0x47,0x49,0x46,0x38)
        else->true
    }
}

sealed interface DownloadState {
    data object None: DownloadState
    data class Downloading(val progress:Float): DownloadState
    data class Done(val file:File): DownloadState
    data class Failed(val reason:String): DownloadState
}

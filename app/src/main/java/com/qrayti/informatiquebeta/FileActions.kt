package com.qrayti.informatiquebeta

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider

object FileActions {
    fun open(context: Context, file: CourseFile, local: java.io.File?) {
        val ext=file.extension
        when {
            ext=="pdf" && local!=null -> context.startActivity(Intent(context, PdfViewerActivity::class.java).putExtra("path",local.absolutePath).putExtra("title",file.displayName))
            ext in setOf("txt","md","csv","log") && local!=null -> context.startActivity(Intent(context, TextViewerActivity::class.java).putExtra("path",local.absolutePath).putExtra("title",file.displayName))
            ext in setOf("png","jpg","jpeg","webp","gif") && local!=null -> context.startActivity(Intent(context, ImageViewerActivity::class.java).putExtra("path",local.absolutePath).putExtra("title",file.displayName))
            ext in setOf("doc","docx","ppt","pptx","pps","ppsx","xls","xlsx") && local!=null -> {
                if(!openExternal(context,local,ext)) context.startActivity(Intent(context, OfficeViewerActivity::class.java).putExtra("url",officeUrl(file)).putExtra("title",file.displayName))
            }
            ext in setOf("doc","docx","ppt","pptx","pps","ppsx","xls","xlsx") -> context.startActivity(Intent(context, OfficeViewerActivity::class.java).putExtra("url",officeUrl(file)).putExtra("title",file.displayName))
            local!=null -> openExternal(context,local,ext)
            else -> context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(file.readUrl)))
        }
    }

    fun share(context:Context,file:CourseFile){
        val i=Intent(Intent.ACTION_SEND).apply{type="text/plain";putExtra(Intent.EXTRA_TEXT,"${file.displayName}\n${file.readUrl}")}
        context.startActivity(Intent.createChooser(i,"شارك الملف"))
    }

    private fun officeUrl(file:CourseFile):String = if(!file.assetUrl.isNullOrBlank()) {
        "${BuildConfig.BASE_URL}/api/office/${Uri.encode(file.id)}/${Uri.encode(file.name)}"
    } else file.readUrl

    fun openExternal(context:Context,local:java.io.File,ext:String):Boolean{
        val uri=FileProvider.getUriForFile(context,"${context.packageName}.files",local)
        val mime=MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext) ?: "application/octet-stream"
        val i=Intent(Intent.ACTION_VIEW).setDataAndType(uri,mime).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        return runCatching{context.startActivity(i);true}.getOrDefault(false)
    }
}

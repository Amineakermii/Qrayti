package com.qrayti.informatiquebeta

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class TextViewerActivity:ComponentActivity(){
    override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState)
        val path=intent.getStringExtra("path")?:return finish();val title=intent.getStringExtra("title")?:"Text"
        setContent{QraytiTheme{TextViewer(path,title){finish()}}}
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun TextViewer(path:String,title:String,onBack:()->Unit){
    var text by remember{mutableStateOf("Loading…")}
    LaunchedEffect(path){text=withContext(Dispatchers.IO){runCatching{
        val file = File(path)
        if (file.length() > 5L * 1024 * 1024) {
            file.inputStream().buffered().use { input ->
                val bytes = ByteArray(5 * 1024 * 1024)
                val count = input.read(bytes)
                bytes.decodeToString(0, count.coerceAtLeast(0)) + "\n\n— عرضنا أول 5 MB لحماية أداء التطبيق —"
            }
        } else file.readText()
    }.getOrElse{"تعذّر فتح الملف: ${it.message}"}}}
    Scaffold(topBar={TopAppBar(title={Text(title,maxLines=1)},navigationIcon={IconButton(onClick=onBack){Icon(Icons.AutoMirrored.Rounded.ArrowBack,null)}})}){p->
        Text(text,modifier=Modifier.fillMaxSize().padding(p).padding(16.dp).verticalScroll(rememberScrollState()),fontFamily=FontFamily.Monospace)
    }
}

package com.qrayti.informatiquebeta

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.Bundle
import android.os.ParcelFileDescriptor
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class PdfViewerActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val path=intent.getStringExtra("path") ?: return finish()
        val title=intent.getStringExtra("title") ?: "PDF"
        setContent { QraytiTheme { NativePdfViewer(path,title){finish()} } }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NativePdfViewer(path:String,title:String,onBack:()->Unit){
    val renderer=remember(path){runCatching {
        val fd=ParcelFileDescriptor.open(File(path),ParcelFileDescriptor.MODE_READ_ONLY)
        PdfRenderer(fd)
    }.getOrNull()}
    DisposableEffect(renderer){onDispose{renderer?.close()}}
    val state=rememberLazyListState()
    val currentPage by remember { derivedStateOf { state.firstVisibleItemIndex + 1 } }
    Scaffold(
        topBar={TopAppBar(
            title={Column { Text(title,maxLines=1); if(renderer != null) Text("$currentPage / ${renderer.pageCount}", style = MaterialTheme.typography.labelSmall) }},
            navigationIcon={IconButton(onClick=onBack){Icon(Icons.AutoMirrored.Rounded.ArrowBack,"رجوع")}}
        )},
        containerColor=MaterialTheme.colorScheme.surfaceVariant
    ){pad->
        if (renderer == null) {
            Box(Modifier.fillMaxSize().padding(pad).padding(24.dp), contentAlignment = Alignment.Center) {
                Text("تعذّر فتح ملف PDF. يمكن يكون الملف ناقص أو معطوب.")
            }
        } else LazyColumn(state=state,modifier=Modifier.fillMaxSize().padding(pad),contentPadding=PaddingValues(10.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){
            items((0 until renderer.pageCount).toList(), key={it}){idx->PdfPage(renderer,idx)}
        }
    }
}

@Composable
private fun PdfPage(renderer:PdfRenderer,index:Int){
    val widthPx = LocalWindowInfo.current.containerSize.width
        .times(1.2f).toInt().coerceIn(720, 1400)
    var bitmap by remember(index){mutableStateOf<Bitmap?>(null)}
    LaunchedEffect(index,widthPx){
        bitmap=withContext(Dispatchers.IO){
            synchronized(renderer){
                renderer.openPage(index).use{page->
                    val ratio=page.height.toFloat()/page.width.coerceAtLeast(1)
                    val renderWidth = minOf(widthPx, (2400 / ratio).toInt().coerceAtLeast(1))
                    val b=Bitmap.createBitmap(renderWidth,(renderWidth*ratio).toInt().coerceAtLeast(1),Bitmap.Config.ARGB_8888)
                    b.eraseColor(Color.WHITE)
                    page.render(b,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    b
                }
            }
        }
    }
    DisposableEffect(index){onDispose{bitmap?.recycle();bitmap=null}}
    Card(modifier=Modifier.fillMaxWidth(),shape=MaterialTheme.shapes.small){
        Box(Modifier.fillMaxWidth().background(androidx.compose.ui.graphics.Color.White),contentAlignment=Alignment.Center){
            val b=bitmap
            if(b==null){Box(Modifier.fillMaxWidth().height(380.dp),contentAlignment=Alignment.Center){CircularProgressIndicator()}}
            else Image(b.asImageBitmap(),"Page ${index+1}",modifier=Modifier.fillMaxWidth(),contentScale=ContentScale.FillWidth)
        }
    }
}

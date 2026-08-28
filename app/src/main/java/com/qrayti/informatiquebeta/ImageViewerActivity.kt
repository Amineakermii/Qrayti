package com.qrayti.informatiquebeta

import android.graphics.BitmapFactory
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ImageViewerActivity:ComponentActivity(){
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState)
  val path=intent.getStringExtra("path")?:return finish();val title=intent.getStringExtra("title")?:"Image"
  setContent{QraytiTheme{ImageViewer(path,title){finish()}}}
 }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun ImageViewer(path:String,title:String,onBack:()->Unit){
 val windowSize = LocalWindowInfo.current.containerSize
 val targetWidth = windowSize.width.coerceAtLeast(720)
 val targetHeight = windowSize.height.coerceAtLeast(1280)
 val bitmap by produceState<android.graphics.Bitmap?>(null, path, targetWidth, targetHeight) {
  value = withContext(Dispatchers.IO) { decodeSampled(path, targetWidth * 2, targetHeight * 2) }
 }
 var scale by remember{mutableFloatStateOf(1f)};var ox by remember{mutableFloatStateOf(0f)};var oy by remember{mutableFloatStateOf(0f)}
 val state=rememberTransformableState{zoom,pan,_->scale=(scale*zoom).coerceIn(1f,5f);ox+=pan.x;oy+=pan.y}
 Scaffold(topBar={TopAppBar(title={Text(title,maxLines=1)},navigationIcon={IconButton(onClick=onBack){Icon(Icons.AutoMirrored.Rounded.ArrowBack,null)}})}){p->
  Box(Modifier.fillMaxSize().padding(p).background(MaterialTheme.colorScheme.scrim.copy(alpha=.9f)).transformable(state),contentAlignment=Alignment.Center){
   if(bitmap!=null) Image(bitmap!!.asImageBitmap(),title,Modifier.fillMaxSize().padding(8.dp).graphicsLayer{scaleX=scale;scaleY=scale;translationX=ox;translationY=oy},contentScale=ContentScale.Fit)
   else CircularProgressIndicator()
  }
 }
}

private fun decodeSampled(path: String, requestedWidth: Int, requestedHeight: Int): android.graphics.Bitmap? {
 val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
 BitmapFactory.decodeFile(path, bounds)
 var sample = 1
 while (bounds.outWidth / sample > requestedWidth * 2 || bounds.outHeight / sample > requestedHeight * 2) sample *= 2
 return BitmapFactory.decodeFile(path, BitmapFactory.Options().apply {
  inSampleSize = sample.coerceAtLeast(1)
  inPreferredConfig = android.graphics.Bitmap.Config.ARGB_8888
 })
}

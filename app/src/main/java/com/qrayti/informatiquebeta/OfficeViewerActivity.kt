package com.qrayti.informatiquebeta

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import java.net.URLEncoder

class OfficeViewerActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val url = intent.getStringExtra("url") ?: return finish()
        val title = intent.getStringExtra("title") ?: "Office"
        setContent { QraytiTheme { OfficeViewer(url, title) { finish() } } }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@OptIn(ExperimentalMaterial3Api::class)
@androidx.compose.runtime.Composable
private fun OfficeViewer(url: String, title: String, close: () -> Unit) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val viewerUrl = remember(url) {
        "https://view.officeapps.live.com/op/embed.aspx?src=" + URLEncoder.encode(url, "UTF-8")
    }
    var progress by remember { mutableIntStateOf(0) }
    var failed by remember { mutableStateOf(false) }
    val webView = remember {
        WebView(context).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.loadsImagesAutomatically = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            settings.setSupportZoom(true)
            settings.builtInZoomControls = true
            settings.displayZoomControls = false
            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) { progress = newProgress }
            }
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view:WebView?,url:String?){failed=false}
                override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                    if (request?.isForMainFrame == true) failed = true
                }
            }
            setDownloadListener { target, _, _, _, _ ->
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(target)))
            }
            loadUrl(viewerUrl)
        }
    }
    DisposableEffect(webView) { onDispose { webView.stopLoading(); webView.destroy() } }
    BackHandler { if (webView.canGoBack()) webView.goBack() else close() }

    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text(if (failed) "تعذّر عرض $title" else title, maxLines = 1) },
            navigationIcon = { IconButton(onClick = close) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "رجوع") } },
            actions = { IconButton(onClick={failed=false;progress=0;webView.reload()}){Icon(Icons.Rounded.Refresh,"عاود جرّب")} },
        )
        if (progress in 0..99) LinearProgressIndicator(progress = { progress / 100f })
        AndroidView(factory = { webView }, modifier = Modifier.fillMaxSize())
    }
}

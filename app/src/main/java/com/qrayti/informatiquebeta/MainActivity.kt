package com.qrayti.informatiquebeta

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        UserStore(applicationContext).markActive()
        IconStateManager.set(applicationContext, LauncherMood.FRESH)
        EngagementManager.schedule(applicationContext)
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 130)
        }
        enableEdgeToEdge()
        setContent {
            val store = remember { UserStore(applicationContext) }
            var theme by remember { mutableStateOf(store.appTheme) }
            QraytiTheme(theme) {
                QraytiApp(
                    theme = theme,
                    onThemeChange = { selected -> store.appTheme = selected; theme = selected },
                )
            }
        }
    }
}

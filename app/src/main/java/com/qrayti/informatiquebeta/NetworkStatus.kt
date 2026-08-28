package com.qrayti.informatiquebeta

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

@Composable
fun rememberIsOnline(): State<Boolean> {
    val context = LocalContext.current.applicationContext
    val connectivity = remember {
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    }
    fun connected(): Boolean = connectivity.getNetworkCapabilities(connectivity.activeNetwork)
        ?.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) == true

    val online = remember { mutableStateOf(connected()) }
    DisposableEffect(connectivity) {
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) { online.value = connected() }
            override fun onLost(network: Network) { online.value = connected() }
            override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
                online.value = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
            }
        }
        connectivity.registerDefaultNetworkCallback(callback)
        onDispose { runCatching { connectivity.unregisterNetworkCallback(callback) } }
    }
    return online
}

package com.qrayti.informatiquebeta

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit
import kotlin.random.Random

enum class LauncherMood(val alias: String) {
    FRESH("MainActivityFresh"),
    TIRED("MainActivityTired"),
    OLD("MainActivityOld"),

    ;
    companion object {
        private const val DAY = 24 * 60 * 60 * 1_000L
        fun fromInactiveMillis(value: Long): LauncherMood = when {
            value >= 10 * DAY -> OLD
            value >= 3 * DAY -> TIRED
            else -> FRESH
        }
    }
}

object IconStateManager {
    fun refresh(context: Context, inactiveMillis: Long) {
        val mood = LauncherMood.fromInactiveMillis(inactiveMillis)
        set(context, mood)
    }

    fun set(context: Context, mood: LauncherMood) {
        val pm = context.packageManager
        val selected = ComponentName(context, "${context.packageName}.${mood.alias}")
        pm.setComponentEnabledSetting(selected, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
        LauncherMood.entries.filter { it != mood }.forEach { item ->
            pm.setComponentEnabledSetting(
                ComponentName(context, "${context.packageName}.${item.alias}"),
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP,
            )
        }
    }
}

object EngagementManager {
    private const val WORK = "qrayti-engagement"
    fun schedule(context: Context) {
        val work = PeriodicWorkRequestBuilder<EngagementWorker>(24, TimeUnit.HOURS, 6, TimeUnit.HOURS)
            .setInitialDelay(24, TimeUnit.HOURS)
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(WORK, ExistingPeriodicWorkPolicy.UPDATE, work)
    }
}

class EngagementWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val user = UserStore(applicationContext)
        val inactive = System.currentTimeMillis() - user.lastActive()
        IconStateManager.refresh(applicationContext, inactive)
        if (inactive >= 2 * DAY && System.currentTimeMillis() - user.lastReminder() >= 36 * 60 * 60 * 1_000L) {
            sendReminder()
            user.markReminderSent()
        }
        return Result.success()
    }

    private fun sendReminder() {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(applicationContext, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        val manager = applicationContext.getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(
            NotificationChannel(CHANNEL, "دفعة قراية", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "تذكيرات خفيفة باش ترجع لكورك"
            },
        )
        val open = PendingIntent.getActivity(
            applicationContext,
            13,
            Intent(applicationContext, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val message = MESSAGES[Random.nextInt(MESSAGES.size)]
        val notification = NotificationCompat.Builder(applicationContext, CHANNEL)
            .setSmallIcon(R.drawable.ic_qrayti_notification)
            .setContentTitle("قرايتي تستنّى فيك 🦊")
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setContentIntent(open)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        NotificationManagerCompat.from(applicationContext).notify(1300, notification)
    }

    companion object {
        private const val CHANNEL = "study_nudges"
        private const val DAY = 24 * 60 * 60 * 1_000L
        private val MESSAGES = listOf(
            "تي وينك عااد",
            "وقيت باش تحل تراجع",
            "تي هاو طلع ساهل الكور ننصحك اعمل طلة عيه",
            "بروجلية 15 مضمونة كان تركز و تحل الكور مافيه شيء",
            "تي هيا عاد",
            "دفوارات قربت عااد",
        )
    }
}

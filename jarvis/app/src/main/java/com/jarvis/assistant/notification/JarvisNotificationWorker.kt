package com.jarvis.assistant.notification

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

class JarvisNotificationWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val tips = listOf(
            "Lembrete: hidrate-se! Beba um copo d'água agora.",
            "Como está sua postura? Endireite as costas!",
            "Dica: dê uma pausa de 5 minutos a cada hora de trabalho.",
            "Bom dia! O que vamos conquistar hoje?",
            "Lembrete de saúde: alongue-se por 2 minutos.",
            "Você sabia? 20 minutos de caminhada melhoram o foco.",
        )
        val tip = tips[(System.currentTimeMillis() % tips.size).toInt()]
        NotificationHelper.showProactiveNotification(applicationContext, tip)
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "jarvis_proactive_notifications"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<JarvisNotificationWorker>(
                2, TimeUnit.HOURS
            )
                .setInitialDelay(30, TimeUnit.MINUTES)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiresBatteryNotLow(true)
                        .build()
                )
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
}

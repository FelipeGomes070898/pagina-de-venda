package com.jarvis.assistant.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.jarvis.assistant.R
import com.jarvis.assistant.ui.chat.ChatActivity
import com.jarvis.assistant.ui.voice.VoiceActivity

class JarvisWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { widgetId ->
            updateWidget(context, appWidgetManager, widgetId)
        }
    }

    companion object {
        fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_jarvis)

            // Tap on "Chat" -> open ChatActivity
            val chatIntent = Intent(context, ChatActivity::class.java)
            val chatPending = PendingIntent.getActivity(
                context, 0, chatIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.btnWidgetChat, chatPending)

            // Tap on mic -> open VoiceActivity
            val voiceIntent = Intent(context, VoiceActivity::class.java)
            val voicePending = PendingIntent.getActivity(
                context, 1, voiceIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.btnWidgetVoice, voicePending)

            manager.updateAppWidget(widgetId, views)
        }
    }
}

package com.jarvis.assistant.voice

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.Locale
import java.util.UUID
import kotlin.coroutines.resume

class TTSManager(context: Context) {

    private var tts: TextToSpeech? = null
    private var isReady = false
    var onSpeakingStateChanged: ((Boolean) -> Unit)? = null

    init {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                configureVoice()
                isReady = true
            }
        }
    }

    private fun configureVoice() {
        val ttsInstance = tts ?: return
        // Try Portuguese Brazilian first, fallback to English
        val ptBr = Locale("pt", "BR")
        val result = ttsInstance.setLanguage(ptBr)
        if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
            ttsInstance.setLanguage(Locale.ENGLISH)
        }
        ttsInstance.setSpeechRate(1.0f)
        ttsInstance.setPitch(0.95f)

        ttsInstance.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                onSpeakingStateChanged?.invoke(true)
            }
            override fun onDone(utteranceId: String?) {
                onSpeakingStateChanged?.invoke(false)
            }
            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) {
                onSpeakingStateChanged?.invoke(false)
            }
        })
    }

    fun speak(text: String) {
        if (!isReady) return
        val utteranceId = UUID.randomUUID().toString()
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
    }

    suspend fun speakAndWait(text: String) = suspendCancellableCoroutine { cont ->
        if (!isReady) {
            cont.resume(Unit)
            return@suspendCancellableCoroutine
        }
        val utteranceId = UUID.randomUUID().toString()
        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) {}
            override fun onDone(id: String?) {
                if (id == utteranceId) cont.resume(Unit)
            }
            @Deprecated("Deprecated in Java")
            override fun onError(id: String?) {
                if (id == utteranceId) cont.resume(Unit)
            }
        })
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
        cont.invokeOnCancellation { tts?.stop() }
    }

    fun stop() {
        tts?.stop()
    }

    fun setSpeed(speed: Float) {
        tts?.setSpeechRate(speed)
    }

    fun setPitch(pitch: Float) {
        tts?.setPitch(pitch)
    }

    fun destroy() {
        tts?.stop()
        tts?.shutdown()
        tts = null
    }
}

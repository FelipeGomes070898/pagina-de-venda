package com.jarvis.assistant.voice

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.util.Locale

sealed class STTResult {
    data class Partial(val text: String) : STTResult()
    data class Final(val text: String) : STTResult()
    data class Error(val code: Int, val message: String) : STTResult()
    object Started : STTResult()
    object Stopped : STTResult()
}

class STTManager(private val context: Context) {

    private var recognizer: SpeechRecognizer? = null

    fun isAvailable() = SpeechRecognizer.isRecognitionAvailable(context)

    fun listen(language: String = "pt-BR"): Flow<STTResult> = callbackFlow {
        recognizer?.destroy()
        recognizer = SpeechRecognizer.createSpeechRecognizer(context)

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1500L)
        }

        recognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                trySend(STTResult.Started)
            }

            override fun onPartialResults(partialResults: Bundle?) {
                val partial = partialResults
                    ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    ?.firstOrNull() ?: return
                if (partial.isNotBlank()) trySend(STTResult.Partial(partial))
            }

            override fun onResults(results: Bundle?) {
                val text = results
                    ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    ?.firstOrNull() ?: ""
                trySend(STTResult.Final(text))
                trySend(STTResult.Stopped)
                close()
            }

            override fun onError(error: Int) {
                val msg = when (error) {
                    SpeechRecognizer.ERROR_AUDIO -> "Erro de áudio"
                    SpeechRecognizer.ERROR_CLIENT -> "Erro do cliente"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Sem permissão de microfone"
                    SpeechRecognizer.ERROR_NETWORK -> "Sem conexão de rede"
                    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Timeout de rede"
                    SpeechRecognizer.ERROR_NO_MATCH -> "Nenhuma fala reconhecida"
                    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Reconhecedor ocupado"
                    SpeechRecognizer.ERROR_SERVER -> "Erro no servidor"
                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Sem fala detectada"
                    else -> "Erro desconhecido ($error)"
                }
                trySend(STTResult.Error(error, msg))
                trySend(STTResult.Stopped)
                close()
            }

            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })

        recognizer?.startListening(intent)

        awaitClose {
            recognizer?.stopListening()
            recognizer?.destroy()
            recognizer = null
        }
    }

    fun stop() {
        recognizer?.stopListening()
    }

    fun destroy() {
        recognizer?.destroy()
        recognizer = null
    }
}

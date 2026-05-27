package com.jarvis.assistant.llm

import android.content.Context
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.withContext
import java.io.File

sealed class LLMState {
    object Uninitialized : LLMState()
    object Loading : LLMState()
    object Ready : LLMState()
    data class Error(val message: String) : LLMState()
}

class LLMEngine(private val context: Context) {

    private var llmInference: LlmInference? = null
    private var session: LlmInferenceSession? = null

    var state: LLMState = LLMState.Uninitialized
        private set

    // System prompt that defines Jarvis's personality
    private val systemPrompt = """You are Jarvis, a highly intelligent and helpful personal AI assistant.
You are concise, friendly, and proactive. You speak naturally and adapt to the user's style.
You remember the context of the conversation and give personalized responses.
When you don't know something, you say so clearly. You prioritize being genuinely useful.
Always respond in the same language the user writes in."""

    suspend fun initialize(modelPath: String): Result<Unit> = withContext(Dispatchers.IO) {
        state = LLMState.Loading
        runCatching {
            val file = File(modelPath)
            require(file.exists()) { "Model file not found at: $modelPath" }

            val options = LlmInference.LlmInferenceOptions.builder()
                .setModelPath(modelPath)
                .setMaxTokens(1024)
                .setTopK(40)
                .setTemperature(0.8f)
                .setRandomSeed(42)
                .build()

            llmInference = LlmInference.createFromOptions(context, options)
            createNewSession()
            state = LLMState.Ready
        }.onFailure { e ->
            state = LLMState.Error(e.message ?: "Unknown error")
        }
    }

    private fun createNewSession() {
        session?.close()
        val sessionOptions = LlmInferenceSession.LlmInferenceSessionOptions.builder()
            .setTopK(40)
            .setTemperature(0.8f)
            .build()
        session = LlmInferenceSession.createFromLlmInference(llmInference!!, sessionOptions)
        // Inject system prompt as context
        session?.addQueryChunk(systemPrompt)
    }

    // Streaming response as Flow
    fun generateResponseStream(userMessage: String): Flow<String> = callbackFlow {
        val currentSession = session ?: run {
            trySend("[Error: LLM not initialized]")
            close()
            return@callbackFlow
        }

        currentSession.addQueryChunk(userMessage)
        currentSession.generateResponseAsync { partialResult, done ->
            if (partialResult != null) {
                trySend(partialResult)
            }
            if (done) {
                close()
            }
        }

        awaitClose()
    }

    // Single-shot response (blocking)
    suspend fun generateResponse(userMessage: String): String = withContext(Dispatchers.IO) {
        val currentSession = session
            ?: return@withContext "[Error: LLM not initialized. Please set up the model first.]"

        currentSession.addQueryChunk(userMessage)
        currentSession.generateResponse()
    }

    fun clearHistory() {
        if (state == LLMState.Ready) {
            createNewSession()
        }
    }

    fun isReady() = state == LLMState.Ready

    fun close() {
        session?.close()
        llmInference?.close()
        llmInference = null
        session = null
        state = LLMState.Uninitialized
    }
}

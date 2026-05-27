package com.jarvis.assistant.ui.voice

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.jarvis.assistant.databinding.ActivityVoiceBinding
import com.jarvis.assistant.ui.chat.ChatViewModel
import com.jarvis.assistant.voice.STTManager
import com.jarvis.assistant.voice.STTResult
import com.jarvis.assistant.voice.TTSManager
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

enum class VoiceState { IDLE, LISTENING, THINKING, SPEAKING }

class VoiceActivity : AppCompatActivity() {

    private lateinit var binding: ActivityVoiceBinding
    private val viewModel: ChatViewModel by viewModels()
    private lateinit var sttManager: STTManager
    private lateinit var ttsManager: TTSManager
    private var sttJob: Job? = null
    private var currentState = VoiceState.IDLE

    private val micPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) startListening()
        else {
            Toast.makeText(this, "Permissão de microfone necessária", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVoiceBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sttManager = STTManager(this)
        ttsManager = TTSManager(this)

        ttsManager.onSpeakingStateChanged = { speaking ->
            runOnUiThread {
                if (speaking) {
                    updateState(VoiceState.SPEAKING)
                } else if (currentState == VoiceState.SPEAKING) {
                    updateState(VoiceState.IDLE)
                }
            }
        }

        binding.btnListen.setOnClickListener {
            when (currentState) {
                VoiceState.IDLE -> requestMicAndListen()
                VoiceState.LISTENING -> stopListening()
                VoiceState.THINKING -> viewModel.stopGeneration()
                VoiceState.SPEAKING -> ttsManager.stop()
            }
        }

        binding.btnClose.setOnClickListener { finish() }

        observeResponses()

        // Auto-start listening
        requestMicAndListen()
    }

    private fun requestMicAndListen() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            == PackageManager.PERMISSION_GRANTED) {
            startListening()
        } else {
            micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    private fun startListening() {
        updateState(VoiceState.LISTENING)
        sttJob = sttManager.listen()
            .onEach { result ->
                when (result) {
                    is STTResult.Partial -> {
                        binding.tvTranscript.text = result.text
                    }
                    is STTResult.Final -> {
                        binding.tvTranscript.text = result.text
                        if (result.text.isNotBlank()) {
                            updateState(VoiceState.THINKING)
                            viewModel.sendMessage(result.text)
                        } else {
                            updateState(VoiceState.IDLE)
                        }
                    }
                    is STTResult.Error -> {
                        if (result.code != android.speech.SpeechRecognizer.ERROR_NO_MATCH &&
                            result.code != android.speech.SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                            binding.tvStatus.text = result.message
                        }
                        updateState(VoiceState.IDLE)
                    }
                    is STTResult.Stopped -> {
                        if (currentState == VoiceState.LISTENING) updateState(VoiceState.IDLE)
                    }
                    else -> {}
                }
            }
            .launchIn(lifecycleScope)
    }

    private fun stopListening() {
        sttManager.stop()
        updateState(VoiceState.IDLE)
    }

    private fun observeResponses() {
        lifecycleScope.launch {
            var lastMessageId = -1L
            viewModel.uiState.collect { state ->
                if (!state.isGenerating && state.messages.isNotEmpty()) {
                    val lastMsg = state.messages.last()
                    if (lastMsg.role == com.jarvis.assistant.ui.chat.ChatMessage.Role.ASSISTANT &&
                        lastMsg.id != lastMessageId && !lastMsg.isStreaming && lastMsg.content.isNotBlank()) {
                        lastMessageId = lastMsg.id
                        binding.tvResponse.text = lastMsg.content
                        ttsManager.speak(lastMsg.content)
                    }
                }
            }
        }
    }

    private fun updateState(state: VoiceState) {
        currentState = state
        runOnUiThread {
            binding.tvStatus.text = when (state) {
                VoiceState.IDLE -> "Toque para falar"
                VoiceState.LISTENING -> "Ouvindo..."
                VoiceState.THINKING -> "Pensando..."
                VoiceState.SPEAKING -> "Falando..."
            }
            binding.btnListen.setImageResource(
                when (state) {
                    VoiceState.LISTENING -> com.jarvis.assistant.R.drawable.ic_mic_active
                    VoiceState.THINKING -> com.jarvis.assistant.R.drawable.ic_thinking
                    VoiceState.SPEAKING -> com.jarvis.assistant.R.drawable.ic_speaker
                    else -> com.jarvis.assistant.R.drawable.ic_mic
                }
            )
            // Pulse animation when listening
            if (state == VoiceState.LISTENING) {
                binding.viewPulse.visibility = android.view.View.VISIBLE
            } else {
                binding.viewPulse.visibility = android.view.View.INVISIBLE
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        sttJob?.cancel()
        sttManager.destroy()
        ttsManager.destroy()
    }
}

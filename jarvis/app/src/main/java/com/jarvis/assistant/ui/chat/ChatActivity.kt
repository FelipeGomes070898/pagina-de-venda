package com.jarvis.assistant.ui.chat

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.inputmethod.EditorInfo
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.jarvis.assistant.R
import com.jarvis.assistant.databinding.ActivityChatBinding
import com.jarvis.assistant.llm.LLMState
import com.jarvis.assistant.ui.setup.SetupActivity
import com.jarvis.assistant.ui.voice.VoiceActivity
import com.jarvis.assistant.voice.STTManager
import com.jarvis.assistant.voice.STTResult
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class ChatActivity : AppCompatActivity() {

    private lateinit var binding: ActivityChatBinding
    private val viewModel: ChatViewModel by viewModels()
    private lateinit var adapter: ChatAdapter
    private lateinit var sttManager: STTManager
    private var sttJob: Job? = null

    private val micPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) startVoiceInput()
        else Toast.makeText(this, "Permissão de microfone necessária", Toast.LENGTH_SHORT).show()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChatBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Jarvis"

        setupRecyclerView()
        setupInputArea()
        observeState()

        sttManager = STTManager(this)

        // Go to setup if no model is configured
        if (com.jarvis.assistant.llm.ModelManager.getSavedModelPath(this) == null) {
            startActivity(Intent(this, SetupActivity::class.java))
        }
    }

    private fun setupRecyclerView() {
        adapter = ChatAdapter()
        val layoutManager = LinearLayoutManager(this).apply {
            stackFromEnd = true
        }
        binding.rvMessages.layoutManager = layoutManager
        binding.rvMessages.adapter = adapter
    }

    private fun setupInputArea() {
        binding.etMessage.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) {
                sendMessage()
                true
            } else false
        }

        binding.btnSend.setOnClickListener { sendMessage() }

        binding.btnMic.setOnClickListener {
            if (sttJob?.isActive == true) {
                stopVoiceInput()
            } else {
                checkMicPermissionAndStart()
            }
        }

        binding.btnVoiceMode.setOnClickListener {
            startActivity(Intent(this, VoiceActivity::class.java))
        }
    }

    private fun sendMessage() {
        val text = binding.etMessage.text?.toString() ?: return
        if (text.isBlank()) return
        binding.etMessage.text?.clear()
        viewModel.sendMessage(text)
    }

    private fun checkMicPermissionAndStart() {
        when {
            ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED -> startVoiceInput()
            else -> micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    private fun startVoiceInput() {
        binding.btnMic.setImageResource(R.drawable.ic_mic_active)
        sttJob = sttManager.listen()
            .onEach { result ->
                when (result) {
                    is STTResult.Partial -> binding.etMessage.setText(result.text)
                    is STTResult.Final -> {
                        binding.etMessage.setText(result.text)
                        if (result.text.isNotBlank()) sendMessage()
                    }
                    is STTResult.Stopped -> {
                        binding.btnMic.setImageResource(R.drawable.ic_mic)
                        sttJob = null
                    }
                    is STTResult.Error -> {
                        binding.btnMic.setImageResource(R.drawable.ic_mic)
                        if (result.code != android.speech.SpeechRecognizer.ERROR_NO_MATCH) {
                            Toast.makeText(this, result.message, Toast.LENGTH_SHORT).show()
                        }
                        sttJob = null
                    }
                    else -> {}
                }
            }
            .launchIn(lifecycleScope)
    }

    private fun stopVoiceInput() {
        sttManager.stop()
        binding.btnMic.setImageResource(R.drawable.ic_mic)
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                // Update message list
                val current = adapter.currentList
                if (current != state.messages) {
                    adapter.submitList(state.messages) {
                        if (state.messages.isNotEmpty()) {
                            binding.rvMessages.smoothScrollToPosition(state.messages.size - 1)
                        }
                    }
                }

                // LLM status indicator
                when (state.llmState) {
                    is LLMState.Loading -> {
                        binding.tvStatus.text = "Carregando modelo..."
                        binding.tvStatus.visibility = android.view.View.VISIBLE
                    }
                    is LLMState.Ready -> {
                        binding.tvStatus.visibility = android.view.View.GONE
                    }
                    is LLMState.Error -> {
                        binding.tvStatus.text = "Erro: ${state.llmState.message}"
                        binding.tvStatus.visibility = android.view.View.VISIBLE
                    }
                    is LLMState.Uninitialized -> {
                        binding.tvStatus.text = "Modelo não instalado — toque em ⚙️ para configurar"
                        binding.tvStatus.visibility = android.view.View.VISIBLE
                    }
                }

                // Send/stop button
                binding.btnSend.isEnabled = !state.isGenerating
            }
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.menu_chat, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_clear -> {
                AlertDialog.Builder(this)
                    .setTitle("Limpar conversa")
                    .setMessage("Apagar todo o histórico de mensagens?")
                    .setPositiveButton("Apagar") { _, _ -> viewModel.clearHistory() }
                    .setNegativeButton("Cancelar", null)
                    .show()
                true
            }
            R.id.action_setup -> {
                startActivity(Intent(this, SetupActivity::class.java))
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        sttManager.destroy()
    }
}

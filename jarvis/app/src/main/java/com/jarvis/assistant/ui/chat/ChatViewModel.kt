package com.jarvis.assistant.ui.chat

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.jarvis.assistant.db.AppDatabase
import com.jarvis.assistant.llm.LLMEngine
import com.jarvis.assistant.llm.LLMState
import com.jarvis.assistant.llm.ModelManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val isGenerating: Boolean = false,
    val llmState: LLMState = LLMState.Uninitialized,
    val error: String? = null
)

class ChatViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getInstance(application)
    private val dao = db.messageDao()
    val llmEngine = LLMEngine(application)

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    val currentConversationId = 1L
    private var streamingJob: Job? = null

    init {
        loadMessages()
        initLLM()
    }

    private fun loadMessages() {
        viewModelScope.launch {
            dao.getMessagesFlow(currentConversationId)
                .map { entities -> entities.map { it.toChatMessage() } }
                .collect { messages ->
                    _uiState.update { it.copy(messages = messages) }
                }
        }
    }

    private fun initLLM() {
        viewModelScope.launch(Dispatchers.IO) {
            val modelPath = ModelManager.getSavedModelPath(getApplication()) ?: return@launch
            _uiState.update { it.copy(llmState = LLMState.Loading) }
            val result = llmEngine.initialize(modelPath)
            _uiState.update { it.copy(llmState = llmEngine.state) }
            result.onFailure { e ->
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun sendMessage(text: String) {
        if (text.isBlank() || _uiState.value.isGenerating) return

        viewModelScope.launch {
            // Save user message
            val userMsg = ChatMessage(role = ChatMessage.Role.USER, content = text.trim())
            dao.insert(userMsg.toEntity(currentConversationId))

            if (!llmEngine.isReady()) {
                val errMsg = ChatMessage(
                    role = ChatMessage.Role.ASSISTANT,
                    content = "Modelo não carregado. Vá em Configurações para instalar o modelo."
                )
                dao.insert(errMsg.toEntity(currentConversationId))
                return@launch
            }

            _uiState.update { it.copy(isGenerating = true) }

            // Insert placeholder streaming message
            val streamingMsg = ChatMessage(
                role = ChatMessage.Role.ASSISTANT,
                content = "",
                isStreaming = true
            )
            val streamingId = dao.insert(streamingMsg.toEntity(currentConversationId))

            val buffer = StringBuilder()
            streamingJob = launch(Dispatchers.IO) {
                llmEngine.generateResponseStream(text)
                    .collect { token ->
                        buffer.append(token)
                        // Update the streaming message in DB periodically
                        if (buffer.length % 20 == 0) {
                            dao.insert(
                                ChatMessage(
                                    id = streamingId,
                                    role = ChatMessage.Role.ASSISTANT,
                                    content = buffer.toString(),
                                    isStreaming = true
                                ).toEntity(currentConversationId)
                            )
                        }
                    }

                // Final save with complete response
                dao.insert(
                    ChatMessage(
                        id = streamingId,
                        role = ChatMessage.Role.ASSISTANT,
                        content = buffer.toString()
                    ).toEntity(currentConversationId)
                )
                _uiState.update { it.copy(isGenerating = false) }
            }
        }
    }

    fun stopGeneration() {
        streamingJob?.cancel()
        _uiState.update { it.copy(isGenerating = false) }
    }

    fun clearHistory() {
        viewModelScope.launch {
            dao.clearConversation(currentConversationId)
            llmEngine.clearHistory()
        }
    }

    fun reloadModel() {
        llmEngine.close()
        initLLM()
    }

    override fun onCleared() {
        super.onCleared()
        llmEngine.close()
    }
}

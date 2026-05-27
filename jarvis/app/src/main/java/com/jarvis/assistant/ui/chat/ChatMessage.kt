package com.jarvis.assistant.ui.chat

import com.jarvis.assistant.db.MessageEntity

data class ChatMessage(
    val id: Long = 0,
    val role: Role,
    val content: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isStreaming: Boolean = false
) {
    enum class Role { USER, ASSISTANT }

    fun toEntity(conversationId: Long) = MessageEntity(
        id = id,
        role = role.name.lowercase(),
        content = content,
        timestamp = timestamp,
        conversationId = conversationId
    )
}

fun MessageEntity.toChatMessage() = ChatMessage(
    id = id,
    role = if (role == "user") ChatMessage.Role.USER else ChatMessage.Role.ASSISTANT,
    content = content,
    timestamp = timestamp
)

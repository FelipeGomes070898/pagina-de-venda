package com.jarvis.assistant.ui.chat

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.jarvis.assistant.R
import java.text.SimpleDateFormat
import java.util.*

class ChatAdapter : ListAdapter<ChatMessage, RecyclerView.ViewHolder>(DiffCallback()) {

    companion object {
        private const val VIEW_USER = 0
        private const val VIEW_ASSISTANT = 1
    }

    override fun getItemViewType(position: Int) =
        if (getItem(position).role == ChatMessage.Role.USER) VIEW_USER else VIEW_ASSISTANT

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == VIEW_USER) {
            UserViewHolder(inflater.inflate(R.layout.item_message_user, parent, false))
        } else {
            AssistantViewHolder(inflater.inflate(R.layout.item_message_assistant, parent, false))
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val msg = getItem(position)
        when (holder) {
            is UserViewHolder -> holder.bind(msg)
            is AssistantViewHolder -> holder.bind(msg)
        }
    }

    class UserViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val tvContent: TextView = view.findViewById(R.id.tvContent)
        private val tvTime: TextView = view.findViewById(R.id.tvTime)

        fun bind(msg: ChatMessage) {
            tvContent.text = msg.content
            tvTime.text = formatTime(msg.timestamp)
        }
    }

    class AssistantViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val tvContent: TextView = view.findViewById(R.id.tvContent)
        private val tvTime: TextView = view.findViewById(R.id.tvTime)
        private val tvTyping: TextView = view.findViewById(R.id.tvTyping)

        fun bind(msg: ChatMessage) {
            if (msg.isStreaming && msg.content.isEmpty()) {
                tvContent.visibility = View.GONE
                tvTyping.visibility = View.VISIBLE
            } else {
                tvContent.visibility = View.VISIBLE
                tvTyping.visibility = View.GONE
                tvContent.text = msg.content
            }
            tvTime.text = if (msg.isStreaming) "" else formatTime(msg.timestamp)
        }
    }

    private class DiffCallback : DiffUtil.ItemCallback<ChatMessage>() {
        override fun areItemsTheSame(old: ChatMessage, new: ChatMessage) = old.id == new.id
        override fun areContentsTheSame(old: ChatMessage, new: ChatMessage) = old == new
    }
}

private val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
private fun formatTime(ts: Long) = timeFormat.format(Date(ts))

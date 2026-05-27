package com.jarvis.assistant.db

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val role: String,         // "user" or "assistant"
    val content: String,
    val timestamp: Long = System.currentTimeMillis(),
    val conversationId: Long = 0
)

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages WHERE conversationId = :convId ORDER BY timestamp ASC")
    fun getMessagesFlow(convId: Long): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE conversationId = :convId ORDER BY timestamp ASC")
    suspend fun getMessages(convId: Long): List<MessageEntity>

    @Insert
    suspend fun insert(message: MessageEntity): Long

    @Query("DELETE FROM messages WHERE conversationId = :convId")
    suspend fun clearConversation(convId: Long)

    @Query("DELETE FROM messages")
    suspend fun clearAll()

    @Query("SELECT DISTINCT conversationId FROM messages ORDER BY conversationId DESC")
    suspend fun getConversationIds(): List<Long>

    @Query("SELECT MAX(timestamp) FROM messages WHERE conversationId = :convId")
    suspend fun getLastTimestamp(convId: Long): Long?
}

@Database(entities = [MessageEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun messageDao(): MessageDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(context.applicationContext, AppDatabase::class.java, "jarvis.db")
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { INSTANCE = it }
            }
    }
}

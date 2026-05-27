package com.jarvis.assistant.llm

import android.content.Context
import java.io.File

object ModelManager {

    // Supported models (user downloads and puts on device)
    val SUPPORTED_MODELS = listOf(
        ModelInfo(
            id = "gemma-2b-it-cpu-int4",
            displayName = "Gemma 2B (Recomendado)",
            description = "Google Gemma 2B — bom equilíbrio entre qualidade e velocidade",
            sizeLabel = "~1.3 GB",
            fileName = "gemma-2b-it-cpu-int4.bin",
            downloadUrl = "https://www.kaggle.com/models/google/gemma/frameworks/tfLite/variations/gemma-2b-it-cpu-int4"
        ),
        ModelInfo(
            id = "gemma-3-1b-it-int4",
            displayName = "Gemma 3 1B (Leve)",
            description = "Menor e mais rápido, ideal para dispositivos com pouca RAM",
            sizeLabel = "~660 MB",
            fileName = "gemma3-1b-it-int4.task",
            downloadUrl = "https://www.kaggle.com/models/google/gemma/frameworks/tfLite/variations/gemma3-1b-it-int4"
        )
    )

    fun getModelPath(context: Context, fileName: String): String {
        return File(context.filesDir, "models/$fileName").absolutePath
    }

    fun isModelReady(context: Context, fileName: String): Boolean {
        return File(context.filesDir, "models/$fileName").exists()
    }

    fun getModelDir(context: Context): File {
        return File(context.filesDir, "models").also { it.mkdirs() }
    }

    fun getSavedModelPath(context: Context): String? {
        val prefs = context.getSharedPreferences("jarvis_prefs", Context.MODE_PRIVATE)
        return prefs.getString("model_path", null)
    }

    fun saveModelPath(context: Context, path: String) {
        context.getSharedPreferences("jarvis_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("model_path", path)
            .apply()
    }
}

data class ModelInfo(
    val id: String,
    val displayName: String,
    val description: String,
    val sizeLabel: String,
    val fileName: String,
    val downloadUrl: String
)

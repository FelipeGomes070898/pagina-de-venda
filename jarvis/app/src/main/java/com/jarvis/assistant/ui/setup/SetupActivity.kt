package com.jarvis.assistant.ui.setup

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.jarvis.assistant.databinding.ActivitySetupBinding
import com.jarvis.assistant.llm.LLMEngine
import com.jarvis.assistant.llm.ModelManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

class SetupActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySetupBinding
    private val llmEngine = LLMEngine(this@SetupActivity.applicationContext?.let { it } ?: this)

    private val filePicker = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { importModel(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySetupBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = "Configurar Jarvis"

        updateStatus()
        setupButtons()
    }

    private fun updateStatus() {
        val modelPath = ModelManager.getSavedModelPath(this)
        if (modelPath != null && File(modelPath).exists()) {
            binding.tvModelStatus.text = "Modelo instalado: ${File(modelPath).name}"
            binding.btnTest.visibility = View.VISIBLE
        } else {
            binding.tvModelStatus.text = "Nenhum modelo instalado"
            binding.btnTest.visibility = View.GONE
        }
    }

    private fun setupButtons() {
        binding.btnImportModel.setOnClickListener {
            filePicker.launch("*/*")
        }

        binding.btnDownloadInfo.setOnClickListener {
            openDownloadInstructions()
        }

        binding.btnTest.setOnClickListener {
            testModel()
        }

        binding.btnDone.setOnClickListener {
            setResult(Activity.RESULT_OK)
            finish()
        }
    }

    private fun importModel(uri: Uri) {
        lifecycleScope.launch {
            binding.progressBar.visibility = View.VISIBLE
            binding.tvModelStatus.text = "Importando modelo..."
            binding.btnImportModel.isEnabled = false

            val result = withContext(Dispatchers.IO) {
                runCatching {
                    val fileName = getFileName(uri) ?: "model.bin"
                    val destDir = ModelManager.getModelDir(applicationContext)
                    val destFile = File(destDir, fileName)

                    contentResolver.openInputStream(uri)?.use { input ->
                        FileOutputStream(destFile).use { output ->
                            input.copyTo(output, bufferSize = 8 * 1024 * 1024)
                        }
                    }
                    destFile.absolutePath
                }
            }

            binding.progressBar.visibility = View.GONE
            binding.btnImportModel.isEnabled = true

            result.onSuccess { path ->
                ModelManager.saveModelPath(applicationContext, path)
                updateStatus()
                Toast.makeText(this@SetupActivity, "Modelo importado com sucesso!", Toast.LENGTH_SHORT).show()
            }.onFailure { e ->
                Toast.makeText(this@SetupActivity, "Erro ao importar: ${e.message}", Toast.LENGTH_LONG).show()
                binding.tvModelStatus.text = "Erro na importação"
            }
        }
    }

    private fun testModel() {
        val modelPath = ModelManager.getSavedModelPath(this) ?: return
        lifecycleScope.launch {
            binding.tvModelStatus.text = "Testando modelo..."
            binding.progressBar.visibility = View.VISIBLE

            val result = llmEngine.initialize(modelPath)
            binding.progressBar.visibility = View.GONE

            if (result.isSuccess) {
                val response = llmEngine.generateResponse("Diga 'Olá, estou pronto para ajudar!' em português.")
                llmEngine.close()
                binding.tvModelStatus.text = "Teste: $response"
                Toast.makeText(this@SetupActivity, "Modelo funcionando!", Toast.LENGTH_SHORT).show()
            } else {
                binding.tvModelStatus.text = "Erro: ${result.exceptionOrNull()?.message}"
            }
        }
    }

    private fun openDownloadInstructions() {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(
            "https://www.kaggle.com/models/google/gemma/frameworks/tfLite"
        ))
        startActivity(intent)
    }

    private fun getFileName(uri: Uri): String? {
        var result: String? = null
        if (uri.scheme == "content") {
            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val idx = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                    if (idx >= 0) result = cursor.getString(idx)
                }
            }
        }
        if (result == null) result = uri.path?.substringAfterLast('/')
        return result
    }
}

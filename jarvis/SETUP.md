# Jarvis — Assistente IA Local para Android

## Requisitos
- Android Studio Hedgehog (2023.1) ou mais recente
- Android SDK 26+
- Dispositivo com 4 GB+ de RAM (recomendado: 6 GB+)

## Como instalar

### 1. Baixar o modelo de IA

O Jarvis usa o modelo **Gemma 2B** do Google, que roda 100% offline no celular.

1. Acesse: https://www.kaggle.com/models/google/gemma/frameworks/tfLite
2. Faça login no Kaggle (gratuito)
3. Baixe: `gemma-2b-it-cpu-int4` (~1.3 GB)
4. Transfira o arquivo `.bin` para o celular (cabo USB ou Google Drive)

### 2. Compilar o app

```bash
cd jarvis
./gradlew assembleDebug
```

Instalar no dispositivo conectado:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 3. Configurar no app

1. Abra o Jarvis
2. Toque em **⚙️ Configurar modelo**
3. Toque em **Selecionar arquivo do modelo**
4. Navegue até o arquivo `.bin` baixado
5. Aguarde a importação e toque em **Testar modelo**

## Funcionalidades

| Feature | Descrição |
|---------|-----------|
| 💬 Chat | Interface de mensagens com streaming de tokens |
| 🎤 Voz | Fale e ouça respostas (STT + TTS nativo Android) |
| 🔊 Modo Voz | Tela fullscreen de conversação por voz |
| 📌 Widget | Acesso rápido na tela inicial |
| 🔔 Notificações | Lembretes proativos a cada 2 horas |
| 🧠 Memória | Histórico de conversa salvo localmente (Room DB) |

## Modelos suportados

| Modelo | Tamanho | Velocidade | Qualidade |
|--------|---------|------------|-----------|
| Gemma 2B IT INT4 | ~1.3 GB | Rápido | Boa |
| Gemma 3 1B IT INT4 | ~660 MB | Muito rápido | Razoável |

## Arquitetura

```
app/
├── llm/
│   ├── LLMEngine.kt        # MediaPipe LLM Inference wrapper
│   └── ModelManager.kt     # Gerenciamento de modelos locais
├── voice/
│   ├── STTManager.kt       # Speech-to-Text (Android SpeechRecognizer)
│   └── TTSManager.kt       # Text-to-Speech (Android TTS)
├── ui/
│   ├── chat/               # Chat Activity + ViewModel + Adapter
│   ├── voice/              # Modo voz fullscreen
│   └── setup/              # Configuração do modelo
├── widget/
│   └── JarvisWidget.kt     # Home screen widget
├── notification/
│   ├── NotificationHelper.kt
│   └── JarvisNotificationWorker.kt  # WorkManager (notificações periódicas)
└── db/
    └── AppDatabase.kt      # Room: histórico de conversas
```

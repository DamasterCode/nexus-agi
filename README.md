# Nexus AI Assistant

Nexus is an advanced, voice-first AI assistant built with React, tRPC, and Drizzle ORM. It features real-time voice recognition, text-to-speech, browser automation, terminal sandbox execution, and multi-model support (including local Ollama and llama.cpp integration).

## Features

- **Multi-Model Support**: Connect to cloud APIs (OpenAI-compatible) or run models locally via Ollama and llama.cpp.
- **Voice-First Interface**: Continuous speech recognition and natural text-to-speech responses.
- **Terminal Sandbox**: Execute commands safely within a virtual environment.
- **Browser Automation**: Let Nexus navigate the web, take screenshots, and interact with pages.
- **Uncensored Mode**: Toggle content filtering on a per-conversation basis.
- **Learning System**: Nexus tracks code improvements and learns from feedback.

## Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL or compatible database (TiDB, PlanetScale, etc.)
- (Optional) [Ollama](https://ollama.com/) for local model execution

## Setup Guide

1. **Clone the repository**
   ```bash
   git clone https://github.com/DamasterCode/nexus-agi.git
   cd nexus-agi
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory based on `.env.example` (if available) or set the following variables:
   ```env
   DATABASE_URL="mysql://user:password@host:port/database"
   JWT_SECRET="your-secret-key"
   VITE_APP_ID="nexus-app"
   OAUTH_SERVER_URL="https://oauth.example.com"
   OWNER_OPEN_ID="your-admin-id"
   
   # Optional: Local Model Endpoints
   OLLAMA_URL="http://localhost:11434"
   LLAMA_CPP_URL="http://localhost:8080"
   ```

4. **Database Setup**
   Push the schema to your database:
   ```bash
   pnpm db:push
   ```

5. **Start the Development Server**
   ```bash
   pnpm dev
   ```
   The application will be available at `http://localhost:3000` (or the next available port).

## Local Model Setup (Ollama)

To run Nexus completely offline or with local models:

1. Install [Ollama](https://ollama.com/).
2. Pull a model (e.g., Llama 3):
   ```bash
   ollama run llama3
   ```
3. Open Nexus, click the **Model** selector in the left panel, and your local Ollama models will be automatically discovered.
4. Select a model to set it as active for your conversations.

## Testing

Run the test suite using Vitest:

```bash
pnpm test
```

Tests cover chat operations, code execution, task management, multi-model routing, and offline detection.

## Architecture

- **Frontend**: React, TailwindCSS, Radix UI, Lucide Icons
- **Backend**: Express, tRPC, Drizzle ORM
- **Database**: MySQL
- **AI Integration**: Custom LLM router supporting Forge, Ollama, llama.cpp, and generic OpenAI-compatible endpoints.

## License

MIT License

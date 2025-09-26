# Bananaboard (live at bananaboard.dev)

<p align="center">
  <img src="readmeDocuments/bananaboardlogo.png" alt="Bananaboard logo" width="400" />
</p>

<div align="center">
  <video src="readmeDocuments/bananaboard.mp4" controls width="720"></video>
  <br/>
</div>

AI-powered image generation and editing using Google Gemini 2.5 Flash with Excalidraw-inspired workspace.
Think of it as an easy way to generate images with AI and have a flow of your edits.

## Quick Start

### 1. Backend Setup

```bash
cd backend && uv sync

# Add your API key to the .env
GEMINI_API_KEY=your_key_here
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Run Everything

```bash
# Terminal 1 - Backend
cd backend && uv run uvicorn app.main:app --reload

# Terminal 2 - Frontend  
cd frontend && npm run dev
```


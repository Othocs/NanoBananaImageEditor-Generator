# Nano Banana Image Editor

AI-powered image generation and editing using Google Gemini 2.5 Flash.

## Features

- **Workbench Canvas**: Free-form canvas for arranging images
- **Multi-Selection**: Select multiple images with Ctrl/Cmd+click or box selection
- **Drag & Drop**: Upload images by dragging them onto the canvas
- **Clipboard Support**: Paste images directly from clipboard
- **Generate Tool**: Use selected images as context for AI generation
- **Area Selection**: Draw selection areas on images for targeted editing
- **Keyboard Shortcuts**:
  - Delete/Backspace: Remove selected images
  - Ctrl/Cmd+A: Select all images
  - Escape: Clear selection

## Quick Start

### 1. Backend Setup (2 steps!)

```bash
# Install dependencies
cd backend && uv sync

# Add your API key (that's it!)
echo "GEMINI_API_KEY=your_key_here" > .env
```

Get your free API key at: https://makersuite.google.com/app/apikey

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

App runs at `http://localhost:5173`

## Usage

1. **Add Images**: 
   - Click the + button in the sidebar
   - Double-click anywhere on the canvas
   - Drag and drop files
   - Paste from clipboard (Ctrl/Cmd+V)

2. **Select Images**:
   - Click to select single image
   - Ctrl/Cmd+click to add to selection
   - Drag empty space to box select

3. **Generate Images**:
   - Select one or more images as context
   - Click the star (Generate) tool
   - Enter your prompt
   - Click Generate

4. **Select Areas**:
   - Choose the Select Area tool (square icon)
   - Click and drag on any image to draw selection

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI + Python + Google Gemini
- **Styling**: Tailwind CSS  
- **State Management**: Zustand
- **Package Management**: npm (frontend), uv (backend)
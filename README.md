# Nano Banana Image Editor

A workbench-style web application for image generation and editing with Nano Banana.

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

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

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
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Backend**: FastAPI + Python (coming soon)
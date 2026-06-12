# Smart Notepad

AI-powered desktop note-taking application built with Electron, React, TailwindCSS, and OpenAI.

## Quick Start

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment
Copy `.env.example` to `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-...
```

### 3. Run in development
```bash
npm run dev
```
This starts:
- Vite dev server (port 5173) for the React frontend
- Express backend (port 3001) for AI API calls
- Electron app pointing to localhost:5173

## Features

- **Smart Notes** — Rich text editor with TipTap, auto-save, tags, colors
- **AI Assistant** — Highlight text → summarize, rewrite, fix grammar, bullet points, action items, expand, simplify
- **Floating Sticky Notes** — Always-on-top draggable windows (Electron only)
- **Workspaces** — Personal, Work, Projects, Ideas (customizable)
- **Smart Search** — Search by keyword, tag, workspace
- **Command Palette** — `Ctrl+Shift+P` to run any command
- **Dark/Light/System Theme** — Auto-detects system preference
- **Offline-First** — All notes stored locally via Electron Store

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+N` | New note |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+F` | Focus search |
| `Ctrl+,` | Settings |
| `Esc` | Close modal |

## Build for Production

```bash
npm run build
```

## Tech Stack

- **Electron** — Desktop shell
- **React 18** + **Vite** — Frontend
- **TipTap** — Rich text editor
- **Zustand** — State management
- **Framer Motion** — Animations
- **Tailwind CSS** — Styling
- **Express** — Backend API
- **OpenAI** — AI features
- **MongoDB** — Optional cloud sync
- **Electron Store** — Local offline storage
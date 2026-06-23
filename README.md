<p align="center">
  <img src="assets/blott.png" alt="blott logo" width="96" />
</p>
<h1 align="center">blott</h1>

A fast, private desktop notepad with AI built in. Write and organise your notes locally — then ask AI questions across all of them at once.

<p align="center">
  <img src="assets/Screenshot 2026-06-23 100840.png" alt="blott app screenshot" width="780" />
</p>

## Download

![Made with](https://img.shields.io/badge/MADE_WITH-grey?style=flat-square)
![Electron](https://img.shields.io/badge/ELECTRON-47848F?style=flat-square&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/REACT-222222?style=flat-square&logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/TAILWIND-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/LICENSE-grey?style=flat-square)
![MIT](https://img.shields.io/badge/MIT-green?style=flat-square)

Click your platform to download the latest version:

[![Windows](https://img.shields.io/badge/WINDOWS-v1.1.2-blue?style=flat-square&logo=windows&logoColor=white)](https://github.com/mr-walter555/blott/releases/latest)
· ⚠️ SmartScreen will block it on first run — click **More info → Run anyway**

[![macOS ARM64](https://img.shields.io/badge/MACOS_ARM64-v1.1.2-blue?style=flat-square&logo=apple&logoColor=white)](https://github.com/mr-walter555/blott/releases/latest)
· ⚠️ Gatekeeper will block it — right-click → **Open** to bypass

[![macOS AMD64](https://img.shields.io/badge/MACOS_AMD64-v1.1.2-blue?style=flat-square&logo=apple&logoColor=white)](https://github.com/mr-walter555/blott/releases/latest)
· ⚠️ Gatekeeper will block it — right-click → **Open** to bypass

[![Linux](https://img.shields.io/badge/LINUX_X86__64-v1.1.2-yellow?style=flat-square&logo=linux&logoColor=white)](https://github.com/mr-walter555/blott/releases/latest)

> Windows 10/11 · macOS 12+ · Linux x86-64 — all badges link to the latest release · app is not code-signed

---

<p align="center">
  <img src="assets/Screenshot 2026-06-04 211434.png" alt="blott app screenshot 2" width="780" />
</p>

---

## First-Run Notes

blott is not code-signed, so each platform may warn you on first launch. The app is safe and fully open source — you can read every line of code here.

### Windows — SmartScreen

1. Click **More info**
2. Click **Run anyway**

Or right-click the `.exe` → **Properties** → check **Unblock** → **Apply**.

### macOS — Gatekeeper

Right-click the `.dmg` → **Open** → click **Open again** in the dialog.

Alternatively, go to **System Settings → Privacy & Security** and click **Open Anyway** after the first blocked attempt.

### Linux

Make the AppImage executable before running:

```bash
chmod +x blott-1.1.2.AppImage
./blott-1.1.2.AppImage
```

---

## Features


- **AI Ask** — Chat with all your notes at once using natural language (`Ctrl+Q`)

<p align="center">
  <img src="assets/Screenshot 2026-06-23 104226.png" alt="Ask AI" width="560" />
</p>
- **AI Inline Actions** — Select text and right-click to summarise, expand, rewrite, translate, and more
- **Quick Capture** — Global shortcut (`Alt+Space`) to jot a thought from anywhere, even when the app is closed

<p align="center">
  <img src="assets/Screenshot 2026-06-23 104842.png" alt="Quick Capture" width="480" />
</p>
- **Floating Sticky Notes** — Pin any note as an always-on-top window on your desktop

<p align="center">
  <img src="assets/Screenshot 2026-06-23 104433.png" alt="Floating sticky note" width="480" />
</p>
- **Command Palette** — Jump to anything with `Ctrl+K`

<p align="center">
  <img src="assets/Screenshot 2026-06-23 104628.png" alt="Command Palette" width="560" />
</p>
- **Dark / Light / System Theme** — Follows your OS preference automatically

---

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

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+N` | New note |
| `Ctrl+K` | Search / Command palette |
| `Ctrl+Q` | Ask AI |
| `Ctrl+P` | Export note as PDF |
| `Ctrl+,` | Settings |
| `Alt+Space` | Quick Capture — works system-wide, even when blott is closed |
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
- **Electron Store** — Local encrypted storage

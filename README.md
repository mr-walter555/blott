<p align="center">
  <img src="assets/blott.png" alt="blott logo" width="96" />
</p>
<h1 align="center">blott</h1>

A fast, private desktop notepad with AI built in. Write and organise your notes locally — then ask AI questions across all of them at once.

<p align="center">
  <img src="assets/Screenshot 2026-06-23 100840.webp" alt="blott app screenshot" width="780" />
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
  <img src="assets/Screenshot 2026-06-04 211434.webp" alt="blott app screenshot 2" width="780" />
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

### Ask AI
Chat with all your notes at once using natural language. Press `Ctrl+Q` to open.

<p align="center">
  <img src="assets/Screenshot 2026-06-23 104226.webp" alt="Ask AI" width="560" />
</p>

### Quick Capture
Press `Alt+Space` from anywhere — even when blott is closed — to instantly jot a thought.

<p align="center">
  <img src="assets/Screenshot 2026-06-23 104842.webp" alt="Quick Capture" width="480" />
</p>

### Floating Sticky Notes
Pin any note as an always-on-top window that stays visible while you work in other apps.

<p align="center">
  <img src="assets/Screenshot 2026-06-23 104433.webp" alt="Floating sticky note" width="480" />
</p>

### Command Palette
Jump to any note, action, or setting instantly with `Ctrl+K`.

<p align="center">
  <img src="assets/Screenshot 2026-06-23 104628.webp" alt="Command Palette" width="560" />
</p>

### More
- **Rich Text Editor** — Headings, bold, italic, lists, code blocks, tables and images via TipTap
- **AI Inline Actions** — Select text and right-click to summarise, expand, rewrite or translate
- **Workspaces** — Group notes into colour-coded workspaces
- **Favourites & Recents** — Fast access to the notes you use most
- **Dark / Light / System Theme** — Follows your OS preference automatically
- **100% Local & Encrypted** — AES-256-GCM encryption; nothing leaves your machine

---
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

## Your Notes Are Stored Here

| Platform | Path |
|---|---|
| Windows | `%APPDATA%\blott\` |
| macOS | `~/Library/Application Support/blott/` |
| Linux | `~/.config/blott/` |

All notes are encrypted with AES-256-GCM before being written to disk — no cloud, no account, no tracking.

## Built With

**Backend:** Electron · Node.js · Electron Store

**Frontend:** React 18 · Vite · TipTap · Zustand · Framer Motion · Tailwind CSS

```

## Contributing

Have an idea or found a bug? Contributions are welcome.

Fork the repo, make your changes, and open a PR. For larger changes please open an issue first to discuss.

## Author

**Walter** ([@mr-walter555](https://github.com/mr-walter555))

## License

MIT

## Acknowledgments

Electron, TipTap, and all the open-source libraries that made this possible.

---

<p align="center">Made with ❤️ by <a href="https://github.com/mr-walter555">mr-walter555</a></p>

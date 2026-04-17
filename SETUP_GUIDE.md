# SilenceX by US - Setup & Installation Guide

This guide will walk you through setting up **SilenceX** so it runs like a professional standalone application (similar to AutoCut), either as a floating window or an external browser-linked tool.

---

## 1. Prerequisites
*   **Adobe Premiere Pro 2023 / 2024 / 2025**.
*   **Node.js** (v18+).
*   **FFmpeg** (Must be in your System PATH).

---

## 2. Global Setup (Mandatory)
Adobe requires the **PlayerDebugMode** to be enabled to load custom plugins like SilenceX.

### Windows:
1.  Open **Command Prompt** (Run as Admin).
2.  Run: `reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f`

---

## 3. Installation (Modern Workflow)
1.  Navigate to Adobe's extension folder:
    *   **Windows**: `%AppData%\Adobe\CEP\extensions\`
    *   **Mac**: `~/Library/Application Support/Adobe/CEP/extensions/`
2.  Create a folder named `com.us.silencex`.
3.  Copy all project files into this folder.

---

## 4. How to use as a "Separate App Window" (AutoCut Style)
If the panel is trapped inside Premiere or showing a blank screen, follow these steps to get the "External App" experience:

### Step A: Start the Backend
Open a terminal in the plugin folder and run:
```bash
npm install
npm run dev
```

### Step B: The Standalone Interface
You have two ways to view SilenceX like a separate app:

1.  **Floating CEP Window**: In Premiere, go to **Window > Extensions > SilenceX**. Once open, **Right-Click the Panel Tab** and select **"Undock Panel"**. You can now move SilenceX to a second monitor or keep it floating above Premiere like a standalone application.
2.  **Browser Mode (Best for UI)**: Open your browser (Chrome/Edge) and go to `http://localhost:3000`. You will see the full Frosted Glass UI. 
    *   *Note: Actions involving the Premiere timeline (Auto-Cut) must be triggered from the actual Extension panel inside Premiere.*

---

## 5. Troubleshooting: Why is my panel blank?
*   **Build Required**: If you are not running `npm run dev`, Premiere won't find the app. If you want to use it without a terminal, run `npm run build` and ensure your `manifest.xml` is configured to point to the `dist` folder.
*   **Restart Premiere**: Premiere Pro only scans for new extensions on startup. Close and re-open Premiere completely.
*   **Registry Check**: Double-check that `CSXS.11` (for PPRO 2023+) PlayerDebugMode is set to `1`.
*   **Firewall**: Ensure your firewall isn't blocking Port 3000.

---

*Professional Tool by Umar S.*

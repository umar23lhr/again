# SilenceX Pro - Standalone Software Guide

SilenceX is now structured as professional standalone software that communicates with Adobe Premiere Pro using a **WebSocket Logic Bridge**. This allows the UI to run perfectly in a high-performance browser window while still controlling the Premiere timeline.

---

## 1. How it Works (The Pro Workflow)
1.  **Backend Server**: Runs on your computer (`server.ts`).
2.  **Logic Bridge**: Connects any browser window (The "Software") to Premiere Pro.
3.  **CEP Proxy**: A small invisible extension inside Premiere that receives commands from the Software and executes the cuts.

---

## 2. Installation Steps

### Step A: Setup Premiere Pro
1.  Copy the `com.us.silencex` folder to `%AppData%\Adobe\CEP\extensions\`.
2.  **Enable Debug Mode**: Run this in CMD as Admin:
    `reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f`
3.  Restart Premiere Pro.

### Step B: Launch the Software
1.  Navigate to your SilenceX folder.
2.  Double-click **`START_SILENCEX.bat`**. This will check for Node.js/FFmpeg and start the engine.
3.  Once the terminal says "Server running", open your browser to:
    `http://localhost:3000`

---

## 3. Connecting to Premiere
*   Open Premiere Pro.
*   Go to **Window > Extensions > SilenceX**. 
*   *Note: Even if the panel looks blank inside Premiere, its "Heart" (the bridge) is now beating. It will automatically connect to the Standalone Software running in your browser.*
*   Now, when you click **"Scan Silence"** or **"Auto-Cut"** in your browser window, Premiere will execute the commands instantly.

---

## 4. Troubleshooting FFmpeg
If the scan fails, ensure `ffmpeg` is globally accessible.
1.  Open CMD and type `ffmpeg -version`.
2.  If it returns an error, download FFmpeg from `ffmpeg.org`, extract it, and add the `bin` folder to your **System Environment Variables (PATH)**.

---

## 5. Build as a Standing Software (.exe)
You can now package SilenceX as a professional `.exe` file that starts both the backend and UI in one click.

1.  Open your terminal in the project folder.
2.  Run: `npm run dist`
3.  Wait for the build to complete. Your professional installer will be located in the `dist` folder.

Once installed, you can simply run **SilenceX Pro** from your desktop icon like any other software!

---
*Professional Video Engineering by Umar S.*

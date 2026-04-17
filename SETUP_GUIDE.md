# SilenceX by US - Setup & Installation Guide

This guide will walk you through the structural setup required to get **SilenceX** running inside your Adobe Premiere Pro 2023 environment.

---

## 1. Prerequisites

Before installing, ensure you have the following tools installed on your machine:

*   **Adobe Premiere Pro 2023** (or 2024).
*   **Node.js** (v18 or higher) - Required for the sidebar logic.
*   **FFmpeg** - Must be installed and added to your System PATH so the terminal can run `ffmpeg` from anywhere.

---

## 2. Enable Adobe Debug Mode (MANDATORY)

By default, Adobe only runs "signed" extensions. To run SilenceX during development, you must enable **PlayerDebugMode**.

### Windows:
1. Open **Command Prompt** as Administrator.
2. Run the following command:
   ```cmd
   reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
   ```

### macOS:
1. Open **Terminal**.
2. Run:
   ```bash
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   ```

---

## 3. Installation Steps

### Step 1: Locate Extension Folder
Navigate to the Adobe CEP extensions directory on your machine:

*   **Windows**: `C:\Users\<YOU>\AppData\Roaming\Adobe\CEP\extensions\`
*   **macOS**: `~/Library/Application Support/Adobe/CEP/extensions/`

*Note: If the `extensions` folder doesn't exist, create it.*

### Step 2: Copy Files
Create a new folder named `com.us.silencex` in that directory and copy all project files into it.

### Step 3: Configure FFmpeg
Ensure FFmpeg is working by opening a terminal and typing `ffmpeg -version`. If it shows an error, you must add it to your environment variables.

---

## 4. Launching the Plugin

Because SilenceX uses a full-stack architecture for high-performance audio analysis, you need to run the bridge server:

1.  Open a terminal inside the `com.us.silencex` folder.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the analyzer server:
    ```bash
    npm run dev
    ```

---

## 5. Usage in Premiere Pro

1.  Open **Adobe Premiere Pro**.
2.  Go to **Window > Extensions > SilenceX by US**.
3.  The panel will appear. 
4.  **Worklow**:
    *   Select your sequence in the timeline.
    *   Click **Analyze Waveform**.
    *   Review the red silence highlights in the visualizer.
    *   Click **Apply & Ripple Cut** to automatically clean your timeline.

---

## 6. Troubleshooting

*   **Panel is Blank**: Ensure `npm run dev` is still running in your terminal.
*   **Analysis Fails**: Check if FFmpeg is installed correctly.
*   **Cuts don't happen**: Ensure you have a sequence "Active" (highlighted) in your Premiere timeline.

---

*Professional Tool by US*

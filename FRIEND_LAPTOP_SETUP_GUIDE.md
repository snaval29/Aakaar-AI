# Aakaar AI — Complete Setup & Deployment Guide
> **One-Stop Guide to Run Frontend + AI Backend Together on a Single Machine / Laptop**

---

## 📌 Architecture Overview

Aakaar AI consists of two parts:
1. **Frontend:** React + Vite interactive UI (Music creation, audio waveform player, scale analyzer).
2. **Backend:** FastAPI + PyTorch AI models:
   - **Feature 1 (Text-to-Music):** Meta's `facebook/musicgen-small`
   - **Feature 2 (Scale & Lyric Predictor):** OpenAI's `whisper-small` + Librosa `pYIN` pitch tracker

By building the frontend once (`npm run build`), **a single Python script (`server.py`) can serve both the React web interface and all AI API endpoints on a single port (`http://localhost:8000`)**.

---

## 💻 1. Prerequisites & System Requirements

- **OS:** Windows 10/11, Linux, or macOS
- **Python:** Python 3.10, 3.11, or 3.12 (64-bit)
- **Node.js:** Node.js v18+ (with `npm`)
- **GPU:** NVIDIA GPU with 4GB+ VRAM (RTX 3050, 3060, 4060, etc.) is strongly recommended for fast generation. *(If no GPU is present, it will run on CPU, but generation will take 1-2 minutes).*

---

## 📦 2. Installation Instructions

### Step A: Install Python AI Dependencies
Open Command Prompt / PowerShell as Administrator and run:

```bash
# 1. Install PyTorch with CUDA 12.1 GPU Acceleration:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# 2. Install Audio and Web Frameworks:
pip install transformers accelerate soundfile librosa openai-whisper fastapi uvicorn python-multipart
```
*(Note: If the laptop does not have an NVIDIA GPU, simply run `pip install torch` without the `--index-url` flag).*

### Step B: Build the React Frontend (One-time step)
In the terminal, navigate to the `frontend/` folder and build the static bundle:

```bash
cd frontend
npm install
npm run build
cd ..
```
This generates the production bundle inside `frontend/dist/`.

---

## 🚀 3. How to Run the App

Whenever you want to start Aakaar AI:

```bash
python server.py
```

1. Open your browser and go to:
   👉 **`http://localhost:8000`**
2. The complete React UI will load immediately.
3. Feature 1 (Text to Music) and Feature 2 (Scale Predictor) will both communicate with the local GPU backend on the same port!

---

## 🌐 4. Exposing to the Public Internet (Optional)

If your friend is running `server.py` on their laptop and you want friends or users outside their local Wi-Fi to use the site:

1. Download **[ngrok](https://ngrok.com)**.
2. Run in a separate terminal:
   ```bash
   ngrok http 8000
   ```
3. ngrok will output a public HTTPS URL (e.g., `https://xxxx.ngrok-free.dev`). Anyone can open that URL in their browser from any device and use Aakaar AI!

---

## 📂 5. Key File Locations & Roles

| File / Folder | Role |
| :--- | :--- |
| **`server.py`** | Master executable script that loads the AI models and serves the web UI. |
| **`frontend/src/`** | React source code for all screens and components. |
| **`frontend/dist/`** | Compiled static assets that `server.py` serves to the browser. |
| **`AakaarAI_Colab_Backend.ipynb`** | Alternative backup notebook if you ever prefer running on Google Colab's cloud GPU instead of a local laptop. |

---

## ⚠️ 6. Important Laptop Settings
If using a friend's laptop as the 24/7 server:
- **Prevent Sleep on Lid Close:** Go to *Windows Control Panel → Power Options → "Choose what closing the lid does"* and select **"Do nothing"**.
- Keep the laptop plugged into its power charger so the GPU performs at full speed.

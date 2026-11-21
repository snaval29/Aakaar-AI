import os
import re
import uuid
import gc
import json
import threading
from pathlib import Path
from collections import Counter

import torch
import numpy as np
import soundfile as sf
import librosa
import whisper
import uvicorn

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from transformers import AutoProcessor, MusicgenForConditionalGeneration

# ----------------- 1. Configuration & Paths -----------------
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🎵 Aakaar AI starting on device: {DEVICE}")

OUTPUT_DIR = Path("generated_audio")
TEMP_DIR = Path("temp_uploads")
FRONTEND_DIST = Path("frontend/dist")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# ----------------- 2. Load AI Models -----------------
print("Loading MusicGen model...")
MUSICGEN_MODEL = "facebook/musicgen-small"
processor = AutoProcessor.from_pretrained(MUSICGEN_MODEL)
music_model = MusicgenForConditionalGeneration.from_pretrained(MUSICGEN_MODEL).to(DEVICE)
music_model.eval()
SAMPLE_RATE = music_model.config.audio_encoder.sampling_rate
print("MusicGen loaded! Sample rate:", SAMPLE_RATE)

print("Loading Whisper model...")
whisper_model = whisper.load_model("small", device=DEVICE)
print("Whisper loaded! All AI models ready.")

# ----------------- 3. Helper Functions -----------------
WORD_CORRECTIONS = {
    "voilen": "violin", "voilin": "violin", "violien": "violin",
    "loofy": "lo-fi", "lofi": "lo-fi", "raininy": "rainy",
    "soothng": "soothing", "relxing": "relaxing",
    "paino": "piano", "drumm": "drums"
}

def clean_prompt(prompt: str) -> str:
    if not prompt or not prompt.strip():
        raise ValueError("Please provide a music description.")
    text = re.sub(r"\s+", " ", prompt.strip())
    for wrong, correct in WORD_CORRECTIONS.items():
        text = re.sub(rf"(?<!\w){re.escape(wrong)}(?!\w)", correct, text, flags=re.IGNORECASE)
    return f"Instrumental music, {text}, coherent musical arrangement, high quality audio"

generation_lock = threading.Lock()

# ----------------- 4. FastAPI Application -----------------
app = FastAPI(title="Aakaar AI Master Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"],
)

# ----------------- 5. Feature 1 API (Text-to-Music) -----------------
class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=500)
    duration: int = Field(default=5, ge=5, le=15)

@app.post("/api/generate")
def generate_music_endpoint(req: GenerateRequest):
    if not generation_lock.acquire(blocking=False):
        raise HTTPException(status_code=429, detail="A generation is already running. Please wait.")
    try:
        final_prompt = clean_prompt(req.prompt)
        inputs = processor(text=[final_prompt], padding=True, return_tensors="pt")
        inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

        max_tokens = req.duration * 50
        with torch.inference_mode():
            audio_values = music_model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                do_sample=True,
                guidance_scale=3.0
            )

        audio = np.squeeze(audio_values[0].detach().float().cpu().numpy())
        if audio.ndim == 2:
            audio = audio.T

        filename = f"music_{uuid.uuid4().hex[:12]}.wav"
        file_path = OUTPUT_DIR / filename
        sf.write(str(file_path), audio, SAMPLE_RATE, subtype="PCM_16")

        return {
            "status": "success",
            "audio_url": f"/api/audio/{filename}",
            "download_url": f"/api/audio/{filename}?download=true",
        }
    except Exception as e:
        print("MusicGen generation error:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        generation_lock.release()

@app.get("/api/audio/{filename}")
def serve_audio_file(filename: str, download: bool = False):
    if not re.fullmatch(r"music_[a-f0-9]{12}\.wav", filename):
        raise HTTPException(status_code=404, detail="File not found.")
    path = OUTPUT_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Audio file not found.")
    return FileResponse(
        str(path),
        media_type="audio/wav",
        filename=filename if download else None,
        content_disposition_type="attachment" if download else "inline"
    )

# ----------------- 6. Feature 2 API (Scale & Lyrics Predictor) -----------------
@app.post("/api/analyze-scale")
async def analyze_scale_endpoint(
    file: UploadFile = File(...),
    start_seconds: float = Form(0.0),
    end_seconds: float = Form(30.0)
):
    temp_id = uuid.uuid4().hex[:8]
    ext = os.path.splitext(file.filename)[1] or ".wav"
    temp_path = TEMP_DIR / f"temp_{temp_id}{ext}"

    try:
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        audio, sr = librosa.load(str(temp_path), sr=22050, mono=True)
        total_duration = len(audio) / sr

        start_sec = max(0.0, float(start_seconds))
        end_sec = min(total_duration, float(end_seconds))
        if end_sec <= start_sec:
            end_sec = min(total_duration, start_sec + 30.0)
        if end_sec - start_sec > 120.0:
            end_sec = start_sec + 120.0

        segment = audio[int(start_sec * sr):int(end_sec * sr)]
        if len(segment) == 0:
            raise HTTPException(status_code=400, detail="Audio segment is empty.")

        segment_16k = librosa.resample(segment, orig_sr=sr, target_sr=16000)
        transcription = whisper_model.transcribe(
            segment_16k,
            language="hi",
            task="transcribe",
            fp16=(DEVICE == "cuda"),
            condition_on_previous_text=False
        )
        lyrics = transcription.get("text", "").strip()
        segments = transcription.get("segments", [])

        f0, voiced_flag, voiced_prob = librosa.pyin(
            segment,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sr,
            frame_length=2048,
            hop_length=256
        )
        times = librosa.times_like(f0, sr=sr, hop_length=256)

        midi_values = np.full(len(f0), np.nan)
        for i, (freq, voiced, conf) in enumerate(zip(f0, voiced_flag, voiced_prob)):
            if voiced and np.isfinite(freq) and conf >= 0.05:
                midi_values[i] = round(librosa.hz_to_midi(freq))

        note_events = []
        curr_note = None
        ev_start = None
        ev_end = None
        frame_step = 256 / sr

        for i, midi in enumerate(midi_values):
            t = float(times[i])
            if np.isfinite(midi):
                midi = int(midi)
                if curr_note is None:
                    curr_note = midi
                    ev_start = t
                    ev_end = t
                elif midi == curr_note and (t - ev_end <= frame_step * 1.5):
                    ev_end = t
                else:
                    if (ev_end - ev_start) >= 0.08:
                        note_events.append({"note": librosa.midi_to_note(curr_note), "start": ev_start + start_sec, "end": ev_end + start_sec})
                    curr_note = midi
                    ev_start = t
                    ev_end = t
            else:
                if curr_note is not None:
                    if (ev_end - ev_start) >= 0.08:
                        note_events.append({"note": librosa.midi_to_note(curr_note), "start": ev_start + start_sec, "end": ev_end + start_sec})
                curr_note = None

        filtered = [e for e in note_events if (e["end"] - e["start"]) >= 0.12]
        note_counts = Counter(e["note"] for e in filtered)
        most_common = note_counts.most_common(1)[0][0] if note_counts else "Unknown"

        structured_lines = []
        if segments:
            for item in segments:
                p_start = float(item["start"]) + start_sec
                p_end = float(item["end"]) + start_sec
                p_text = item["text"].strip()
                overlapping = [e["note"] for e in filtered if e["start"] < p_end and e["end"] > p_start]

                words = p_text.split()
                line = []
                for idx, w in enumerate(words):
                    assigned = overlapping[idx] if idx < len(overlapping) else (overlapping[-1] if overlapping else "--")
                    line.append({"word": w, "note": assigned})
                if line:
                    structured_lines.append(line)
        else:
            words = [{"word": "♪", "note": e["note"]} for e in filtered[:20]]
            structured_lines.append(words)

        return {
            "status": "success",
            "file_name": file.filename,
            "duration": round(total_duration, 2),
            "start_seconds": round(start_sec, 2),
            "end_seconds": round(end_sec, 2),
            "detected_scale": f"{most_common} Scale",
            "language": transcription.get("language", "hi").upper(),
            "lyrics": lyrics if lyrics else "[Instrumental / No lyrics detected]",
            "lines": structured_lines
        }
    except Exception as e:
        print("Scale analysis error:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path.exists():
            try:
                temp_path.unlink()
            except OSError:
                pass

# ----------------- 7. Serve React Frontend Directly -----------------
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_ui(full_path: str):
        target = FRONTEND_DIST / full_path
        if target.is_file():
            return FileResponse(target)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)

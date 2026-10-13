# 🎵 Aakaar AI

Aakaar AI is a Python-based music project featuring AI-powered music generation and experimental music analysis tools.

## 🎼 Features

### Feature 1: Text-to-Music Generation

Transform text prompts into music. This feature aims to generate music based on descriptions of mood, genre, and musical style.

- 🎶 Text-based music generation
- 💬 Prompt-driven music creation
- 🐍 Python-based implementation

### Feature 2: Music Scale Predictor

Analyze a selected segment of an audio file to transcribe Hindi lyrics and estimate musical notes.

- 🎤 Hindi lyric transcription using Whisper
- 🎵 Pitch detection and musical note estimation
- ⏱️ Select an audio segment for analysis (up to 120 seconds)
- 📝 Experimental alignment of detected notes with lyric phrases
- 📄 Export analysis results to a TXT report
- ⚡ GPU acceleration when available

**Note:** Pitch detection may include instrumental sounds as well as vocals. Lyrics and notes are currently aligned at the phrase level, not at individual word or syllable level. Detected notes do not, by themselves, establish the song's musical key or scale.

---

## 📁 Project Structure

```text
Aakaar-AI/
├── Feature 1/
│   └── text to music.py
├── Feature 2/
│   └── music scale predictor.py
├── AakaarAI.ipynb
└── README.md
```

## ⚙️ Requirements

- Python 3
- Required Python libraries for Feature 1 (see the imports in the source code)
- NumPy
- Librosa
- PyTorch
- OpenAI Whisper
- Google Colab (recommended for running Feature 2)
- A compatible GPU for faster processing (optional)

Install the required dependencies for each feature before running it. Feature 2 also requires access to an audio file for analysis.

## 🚀 Getting Started

### Feature 1: Text-to-Music Generation

1. Clone or download this repository.
2. Open the `Feature 1` folder.
3. Install the required dependencies.
4. Run `text to music.py` or open `AakaarAI.ipynb` in Google Colab, depending on your setup.

### Feature 2: Music Scale Predictor

1. Open `AakaarAI.ipynb` in Google Colab, or run `music scale predictor.py` in a compatible Python environment.
2. Install the required dependencies.
3. Run the code and upload an audio file when prompted.
4. Enter the start and end times of the segment you want to analyze. The segment must not exceed 120 seconds.
5. Review the transcribed Hindi lyrics and estimated musical notes.
6. Download the generated `aakar_aligned_analysis.txt` report.

## 🔮 Future Improvements

- Improve music generation quality and support more musical styles
- Separate vocals from instrumental accompaniment for more accurate pitch detection
- Improve Hindi lyric transcription
- Align notes with individual Hindi words and syllables
- Improve musical key and scale prediction
- Develop a user-friendly interface integrating both features

---

**Developed as part of the Aakaar AI project.**

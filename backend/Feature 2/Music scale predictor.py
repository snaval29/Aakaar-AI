
# ============================================================
# AAKAR AI — FEATURE 2: MUSIC SCALE PREDICTOR
# Single-cell Google Colab implementation
#
# Features:
# 1. Upload an audio file
# 2. Select a segment (maximum 120 seconds)
# 3. Transcribe Hindi lyrics using Whisper
# 4. Detect pitch and estimate musical notes using librosa
# 5. Group consecutive notes into note events
# 6. Align detected notes with lyric phrases experimentally
# 7. Export the analysis as a TXT file
#
# Note: Detected pitches may include instruments, not just vocals.
# Phrase alignment does NOT guarantee word/syllable-level accuracy.
# ============================================================

import os
import numpy as np
import librosa
import torch
import whisper

from google.colab import files
from IPython.display import Audio, display


# ------------------------------------------------------------
# 1. CONFIGURATION
# ------------------------------------------------------------

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

MIN_CONFIDENCE = 0.05
MIN_NOTE_DURATION = 0.12
MAX_SEGMENT_DURATION = 120.0

SAMPLE_RATE = 22050
HOP_LENGTH = 256
FRAME_LENGTH = 4096

print("=" * 60)
print("AAKAR AI — MUSIC SCALE PREDICTOR")
print("=" * 60)
print("Device:", DEVICE)

if DEVICE == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))
else:
    print("GPU unavailable; processing on CPU.")


# ------------------------------------------------------------
# 2. UPLOAD AUDIO
# ------------------------------------------------------------

print("\nUpload your music/audio file:")
uploaded = files.upload()

if not uploaded:
    raise ValueError("No audio file uploaded.")

audio_path = next(iter(uploaded.keys()))

audio, sr = librosa.load(
    audio_path,
    sr=SAMPLE_RATE,
    mono=True
)

duration = len(audio) / sr

if duration <= 0:
    raise ValueError("The audio file is empty or unreadable.")

print("\nAudio loaded successfully.")
print("File:", audio_path)
print(f"Duration: {duration:.2f} seconds")
print(f"Sample rate: {sr} Hz")

display(Audio(audio, rate=sr))


# ------------------------------------------------------------
# 3. SELECT AUDIO SEGMENT
# ------------------------------------------------------------

print("\nSelect the segment to analyse.")
print(f"Maximum allowed segment: {MAX_SEGMENT_DURATION:.0f} seconds")

start_seconds = float(
    input(f"Enter start time (0 to {duration:.2f}): ")
)

end_seconds = float(
    input(f"Enter end time ({start_seconds:.2f} to {duration:.2f}): ")
)

if start_seconds < 0:
    raise ValueError("Start time cannot be negative.")

if end_seconds <= start_seconds:
    raise ValueError("End time must be greater than start time.")

if end_seconds > duration:
    raise ValueError("End time exceeds the audio duration.")

if end_seconds - start_seconds > MAX_SEGMENT_DURATION:
    raise ValueError("Please select a segment of 120 seconds or less.")

start_sample = int(start_seconds * sr)
end_sample = int(end_seconds * sr)

segment = audio[start_sample:end_sample]

if len(segment) == 0:
    raise ValueError("The selected audio segment is empty.")

print(
    f"\nSelected segment: {start_seconds:.2f}s - "
    f"{end_seconds:.2f}s"
)
print(f"Segment duration: {len(segment) / sr:.2f} seconds")

display(Audio(segment, rate=sr))


# ------------------------------------------------------------
# 4. HINDI LYRIC TRANSCRIPTION WITH WHISPER
# ------------------------------------------------------------

print("\nLoading Whisper Small model...")

model = whisper.load_model("small", device=DEVICE)

print("Transcribing Hindi lyrics...")

segment_16k = librosa.resample(
    segment,
    orig_sr=sr,
    target_sr=16000
)

transcription = model.transcribe(
    segment_16k,
    language="hi",
    task="transcribe",
    fp16=(DEVICE == "cuda"),
    condition_on_previous_text=False
)

lyrics = transcription.get("text", "").strip()
lyric_segments = transcription.get("segments", [])

print("\nDetected language:", transcription.get("language", "unknown"))
print("\nTRANSCRIBED LYRICS:")
print(lyrics if lyrics else "[No lyrics detected]")

print("\nTIMESTAMPED LYRIC PHRASES:")

for item in lyric_segments:
    phrase_start = float(item["start"]) + start_seconds
    phrase_end = float(item["end"]) + start_seconds

    print(
        f"{phrase_start:.2f}s - {phrase_end:.2f}s: "
        f"{item['text'].strip()}"
    )


# ------------------------------------------------------------
# 5. PITCH DETECTION
# ------------------------------------------------------------

print("\nDetecting pitch...")

f0, voiced_flag, voiced_prob = librosa.pyin(
    segment,
    fmin=librosa.note_to_hz("C2"),
    fmax=librosa.note_to_hz("C7"),
    sr=sr,
    frame_length=FRAME_LENGTH,
    hop_length=HOP_LENGTH
)

times = librosa.times_like(
    f0,
    sr=sr,
    hop_length=HOP_LENGTH
)

print("Pitch detection completed.")
print("Total frames:", len(f0))

voiced_count = int(np.sum(voiced_flag))
print("Frames marked voiced:", voiced_count)

if len(voiced_flag) > 0:
    print(
        f"Voiced-frame percentage: "
        f"{100 * voiced_count / len(voiced_flag):.2f}%"
    )


# ------------------------------------------------------------
# 6. CONVERT PITCH TO MUSICAL NOTES
# ------------------------------------------------------------

print("\nConverting detected pitch to musical notes...")

midi_values = np.full(len(f0), np.nan)

for i, (freq, voiced, confidence) in enumerate(
    zip(f0, voiced_flag, voiced_prob)
):
    if (
        voiced
        and np.isfinite(freq)
        and np.isfinite(confidence)
        and confidence >= MIN_CONFIDENCE
    ):
        midi_values[i] = round(librosa.hz_to_midi(freq))


# ------------------------------------------------------------
# 7. GROUP CONSECUTIVE FRAMES INTO NOTE EVENTS
# ------------------------------------------------------------

raw_note_events = []
current_note = None
event_start = None
event_end = None

for i, midi_note in enumerate(midi_values):
    frame_start = float(times[i]) + start_seconds
    frame_end = (
        float(times[i]) + HOP_LENGTH / sr + start_seconds
    )

    if np.isfinite(midi_note):
        midi_note = int(midi_note)

        if current_note is None:
            current_note = midi_note
            event_start = frame_start
            event_end = frame_end

        elif midi_note == current_note:
            event_end = frame_end

        else:
            raw_note_events.append({
                "midi_note": current_note,
                "start_seconds": event_start,
                "end_seconds": event_end
            })

            current_note = midi_note
            event_start = frame_start
            event_end = frame_end

    else:
        if current_note is not None:
            raw_note_events.append({
                "midi_note": current_note,
                "start_seconds": event_start,
                "end_seconds": event_end
            })

        current_note = None
        event_start = None
        event_end = None

# Save the final event if the audio ends on a detected note.
if current_note is not None:
    raw_note_events.append({
        "midi_note": current_note,
        "start_seconds": event_start,
        "end_seconds": event_end
    })


# ------------------------------------------------------------
# 8. FILTER SHORT EVENTS AND LABEL NOTES
# ------------------------------------------------------------

filtered_events = []

for event in raw_note_events:
    note_duration = (
        event["end_seconds"] - event["start_seconds"]
    )

    if note_duration >= MIN_NOTE_DURATION:
        note_name = librosa.midi_to_note(
            event["midi_note"]
        )

        filtered_events.append({
            "note": note_name,
            "midi_note": int(event["midi_note"]),
            "start_seconds": round(
                event["start_seconds"], 3
            ),
            "end_seconds": round(
                event["end_seconds"], 3
            ),
            "duration_seconds": round(
                note_duration, 3
            )
        })

print("\nNOTE DETECTION SUMMARY")
print("Raw note events:", len(raw_note_events))
print("Filtered note events:", len(filtered_events))

print("\nDETECTED NOTE EVENTS:")

for event in filtered_events:
    print(
        f"{event['start_seconds']:.2f}s - "
        f"{event['end_seconds']:.2f}s | "
        f"{event['note']} | "
        f"{event['duration_seconds']:.2f}s"
    )

if not filtered_events:
    print(
        "No note events passed the current filters. "
        "Try reviewing the audio segment or adjusting "
        "MIN_CONFIDENCE / MIN_NOTE_DURATION."
    )


# ------------------------------------------------------------
# 9. EXPERIMENTAL LYRIC-PHRASE / NOTE ALIGNMENT
# ------------------------------------------------------------

print("\nAligning note events with lyric phrases...")

aligned_phrases = []

for lyric in lyric_segments:
    phrase_start = float(lyric["start"]) + start_seconds
    phrase_end = float(lyric["end"]) + start_seconds

    overlapping_notes = [
        {
            "note": event["note"],
            "start_seconds": event["start_seconds"],
            "end_seconds": event["end_seconds"],
            "duration_seconds": event["duration_seconds"]
        }
        for event in filtered_events
        if (
            event["start_seconds"] < phrase_end
            and event["end_seconds"] > phrase_start
        )
    ]

    aligned_phrases.append({
        "start_seconds": round(phrase_start, 3),
        "end_seconds": round(phrase_end, 3),
        "lyrics": lyric["text"].strip(),
        "notes": overlapping_notes
    })


# ------------------------------------------------------------
# 10. DISPLAY ALIGNMENT RESULTS
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("LYRICS WITH EXPERIMENTALLY ALIGNED NOTES")
print("=" * 60)

for phrase in aligned_phrases:
    print(
        f"\n[{phrase['start_seconds']:.2f}s - "
        f"{phrase['end_seconds']:.2f}s]"
    )
    print("Lyrics:", phrase["lyrics"])

    if phrase["notes"]:
        print("Detected notes:")

        for note in phrase["notes"]:
            print(
                f"  {note['note']} | "
                f"{note['start_seconds']:.2f}s - "
                f"{note['end_seconds']:.2f}s"
            )
    else:
        print("Detected notes: None")


# ------------------------------------------------------------
# 11. EXPORT RESULTS TO A TXT REPORT
# ------------------------------------------------------------

report_path = "aakar_aligned_analysis.txt"

with open(report_path, "w", encoding="utf-8") as f:
    f.write("AAKAR AI - MUSIC SCALE PREDICTOR\n")
    f.write("=" * 55 + "\n\n")

    f.write(f"Audio file: {audio_path}\n")
    f.write(f"Audio duration: {duration:.2f} seconds\n")
    f.write(f"Selected start: {start_seconds:.2f} seconds\n")
    f.write(f"Selected end: {end_seconds:.2f} seconds\n")
    f.write(f"Language: {transcription.get('language', 'unknown')}\n")
    f.write(f"Processing device: {DEVICE}\n")

    f.write(
        "Alignment type: Experimental phrase-level alignment\n\n"
    )

    f.write("TRANSCRIBED LYRICS\n")
    f.write("-" * 55 + "\n")
    f.write((lyrics if lyrics else "[No lyrics detected]") + "\n\n")

    f.write("DETECTED NOTE EVENTS\n")
    f.write("-" * 55 + "\n")

    if filtered_events:
        for event in filtered_events:
            f.write(
                f"{event['start_seconds']:.3f}s - "
                f"{event['end_seconds']:.3f}s | "
                f"{event['note']} | "
                f"Duration: {event['duration_seconds']:.3f}s\n"
            )
    else:
        f.write("No note events passed the filters.\n")

    f.write("\nLYRICS AND DETECTED NOTES\n")
    f.write("-" * 55 + "\n")

    for phrase in aligned_phrases:
        f.write(
            f"\n[{phrase['start_seconds']:.2f}s - "
            f"{phrase['end_seconds']:.2f}s]\n"
        )
        f.write(f"Lyrics: {phrase['lyrics']}\n")

        if phrase["notes"]:
            for note in phrase["notes"]:
                f.write(
                    f"  Note: {note['note']} | "
                    f"{note['start_seconds']:.3f}s - "
                    f"{note['end_seconds']:.3f}s\n"
                )
        else:
            f.write("  Detected notes: None\n")

    f.write("\n" + "=" * 55 + "\n")
    f.write("IMPORTANT LIMITATIONS\n")
    f.write(
        "1. Pitch detection may capture instruments as well as vocals.\n"
    )
    f.write(
        "2. Notes are matched to whole lyric phrases by timestamp overlap.\n"
    )
    f.write(
        "3. This is not verified word-level or syllable-level alignment.\n"
    )
    f.write(
        "4. Detected pitch notes alone do not establish the song's key or scale.\n"
    )

print("\nTXT report created:", report_path)
files.download(report_path)

print("\nAnalysis completed.")

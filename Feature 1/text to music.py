import os
import re
import uuid
import gc
import torch
import numpy as np
import soundfile as sf
import gradio as gr

from transformers import AutoProcessor, MusicgenForConditionalGeneration

# ==========================================
# 1. CONFIGURATION
# ==========================================

MODEL_NAME = "facebook/musicgen-small"
OUTPUT_DIR = os.path.join(os.getcwd(), "generated_audio")
os.makedirs(OUTPUT_DIR, exist_ok=True)

device = "cuda" if torch.cuda.is_available() else "cpu"
print("Using device:", device)

if device == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))
else:
    print("CPU mode: generation may be slow.")

# ==========================================
# 2. PROMPT PROCESSING
# ==========================================

WORD_CORRECTIONS = {
    "voilen": "violin",
    "voilin": "violin",
    "violien": "violin",
    "loofy": "lo-fi",
    "lofi": "lo-fi",
    "raininy": "rainy",
    "soothng": "soothing",
    "relxing": "relaxing",
    "paino": "piano",
    "drumm": "drums",
}

def process_prompt(user_prompt):
    if not isinstance(user_prompt, str) or not user_prompt.strip():
        raise ValueError("Please enter a music description.")

    prompt = re.sub(r"\s+", " ", user_prompt.strip())

    for wrong, correct in WORD_CORRECTIONS.items():
        prompt = re.sub(
            rf"(?<!\w){re.escape(wrong)}(?!\w)",
            correct,
            prompt,
            flags=re.IGNORECASE
        )

    # Preserve the user's idea; do not force a genre template.
    prompt = (
        "Instrumental music, "
        + prompt
        + ", coherent musical arrangement, high quality audio"
    )

    return prompt

# ==========================================
# 3. LOAD MODEL ONCE
# ==========================================

print("Loading MusicGen model...")

processor = AutoProcessor.from_pretrained(MODEL_NAME)
model = MusicgenForConditionalGeneration.from_pretrained(MODEL_NAME)
model.to(device)
model.eval()

SAMPLE_RATE = model.config.audio_encoder.sampling_rate

print("MusicGen loaded successfully.")
print("Sample rate:", SAMPLE_RATE)

# ==========================================
# 4. MUSIC GENERATION
# ==========================================

def generate_music(user_prompt, duration):
    try:
        duration = int(duration)

        if not 5 <= duration <= 15:
            raise ValueError("Duration must be between 5 and 15 seconds.")

        final_prompt = process_prompt(user_prompt)

        print("\nOriginal prompt:", user_prompt)
        print("Processed prompt:", final_prompt)

        inputs = processor(
            text=[final_prompt],
            padding=True,
            return_tensors="pt"
        )

        inputs = {
            key: value.to(device)
            for key, value in inputs.items()
        }

        # MusicGen uses approximately 50 generated tokens per second.
        max_new_tokens = duration * 50

        with torch.inference_mode():
            audio_values = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                guidance_scale=3.0
            )

        print("Audio tensor shape:", tuple(audio_values.shape))

        if audio_values.ndim != 3 or audio_values.shape[-1] == 0:
            raise RuntimeError("The model returned an empty audio tensor.")

        # Extract first track: [channels, samples]
        audio = audio_values[0].detach().float().cpu().numpy()
        audio = np.squeeze(audio)

        if audio.ndim == 1:
            pass
        elif audio.ndim == 2:
            audio = audio.T
        else:
            raise RuntimeError("Unexpected audio tensor dimensions.")

        if audio.size == 0 or not np.isfinite(audio).all():
            raise RuntimeError("Audio contains no valid samples.")

        peak = float(np.max(np.abs(audio)))
        rms = float(np.sqrt(np.mean(np.square(audio))))

        print("Peak amplitude:", peak)
        print("RMS amplitude:", rms)

        if peak < 1e-5 or rms < 1e-7:
            raise RuntimeError(
                "Generated audio is nearly silent. Try generating again."
            )

        filename = f"music_{uuid.uuid4().hex[:10]}.wav"
        output_path = os.path.join(OUTPUT_DIR, filename)

        sf.write(
            output_path,
            audio,
            SAMPLE_RATE,
            subtype="PCM_16"
        )

        # Verify the saved audio file.
        saved_audio, saved_sr = sf.read(output_path)
        file_size = os.path.getsize(output_path)
        saved_duration = len(saved_audio) / saved_sr

        if len(saved_audio) == 0 or file_size < 1000:
            raise RuntimeError("Saved audio file is empty or invalid.")

        print("Saved:", output_path)
        print("File size:", file_size, "bytes")
        print("Duration:", round(saved_duration, 2), "seconds")

        return (
            output_path,
            f"Generation successful. Prompt used: {final_prompt}"
        )

    except torch.cuda.OutOfMemoryError:
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
        return None, "GPU memory exhausted. Try a 5-second generation."

    except Exception as exc:
        print("Generation error:", repr(exc))
        return None, f"Generation failed: {exc}"

# ==========================================
# 5. GRADIO INTERFACE
# ==========================================

def gradio_wrapper(prompt, duration):
    audio_path, status = generate_music(prompt, duration)
    return status, audio_path

with gr.Blocks(title="Text-to-Music Generator") as demo:
    gr.Markdown("# AI Text-to-Music Generator")
    gr.Markdown(
        "Describe any music idea in your own words. "
        "You are not restricted to predefined genres."
    )

    prompt_input = gr.Textbox(
        label="Describe your music",
        placeholder=(
            "Rainy night, piano and violin, "
            "with a smooth lo-fi atmosphere..."
        ),
        lines=3
    )

    duration_input = gr.Slider(
        minimum=5,
        maximum=15,
        value=5,
        step=1,
        label="Duration (seconds)"
    )

    generate_button = gr.Button(
        "Generate Music",
        variant="primary"
    )

    status_output = gr.Textbox(
        label="Status",
        interactive=False
    )

    audio_output = gr.Audio(
        label="Generated Music",
        type="filepath"
    )

    generate_button.click(
        fn=gradio_wrapper,
        inputs=[prompt_input, duration_input],
        outputs=[status_output, audio_output]
    )

demo.launch(share=True, debug=True)
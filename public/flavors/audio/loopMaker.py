import os
import librosa
import soundfile as sf

BEATS_PER_BAR = 4
TARGET_SR = 44100
DESIRED_SECONDS = 5.0
BAR_OFFSET = 1

FOLDER_PAIRS = [
    ("./81BPM", "./out/81BPM"),
    ("./110BPM", "./out/110BPM"),
    ("./124BPM", "./out/124BPM"),
    ("./130BPM", "./out/130BPM")
]

def extract_bpm_from_path(path):
    name = os.path.basename(path)
    return int("".join(c for c in name if c.isdigit()))

def process_pair(input_dir, output_dir):
    bpm = extract_bpm_from_path(input_dir)

    seconds_per_beat = 60.0 / bpm
    seconds_per_bar = seconds_per_beat * BEATS_PER_BAR

    beats_per_piece = max(1, round(DESIRED_SECONDS / seconds_per_beat))
    piece_seconds = beats_per_piece * seconds_per_beat
    piece_samples = int(piece_seconds * TARGET_SR)

    bar_offset_samples = int(BAR_OFFSET * seconds_per_bar * TARGET_SR)

    os.makedirs(output_dir, exist_ok=True)
    index = 0

    for file in sorted(os.listdir(input_dir)):
        if not file.lower().endswith((".wav", ".mp3", ".ogg")):
            continue

        path = os.path.join(input_dir, file)
        audio, sr = librosa.load(path, sr=TARGET_SR, mono=True)

        start = bar_offset_samples
        end = start + piece_samples

        if len(audio) < end:
            continue

        piece = audio[start:end]

        out_path = os.path.join(output_dir, f"{index}.wav")
        sf.write(out_path, piece, sr)

        index += 1

for input_dir, output_dir in FOLDER_PAIRS:
    process_pair(input_dir, output_dir)

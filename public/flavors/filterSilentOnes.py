import os
import librosa
import numpy as np

FOLDERS = [
    "./out/81BPM",
    "./out/110BPM",
    "./out/124BPM",
    "./out/130BPM"
]

SUM_DB_THRESHOLD = -12000  # Adjust this threshold

def is_silent(audio):
    rms = librosa.feature.rms(y=audio)[0]
    rms_db = librosa.amplitude_to_db(rms, ref=np.max)

    # Sum all dB values
    total_db = np.sum(rms_db)
    return total_db < SUM_DB_THRESHOLD

for folder in FOLDERS:
    for file in os.listdir(folder):
        if not file.lower().endswith((".wav", ".mp3", ".ogg")):
            continue

        path = os.path.join(folder, file)
        audio, sr = librosa.load(path, sr=44100, mono=True)

        if is_silent(audio):
            os.remove(path)
            print(f"Deleted silent file: {path}")
        else:
            print(f"Kept: {path}")

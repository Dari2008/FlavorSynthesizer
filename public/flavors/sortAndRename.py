import os
import re
import uuid

FOLDERS = [
    "./out/81BPM",
    "./out/110BPM",
    "./out/124BPM",
    "./out/130BPM"
]

# Extract the numeric part from filename (e.g. "12.wav" -> 12)
def get_number(filename):
    match = re.match(r"(\d+)", filename)
    return int(match.group(1)) if match else -1

for folder in FOLDERS:
    files = [f for f in os.listdir(folder) if f.lower().endswith((".wav", ".mp3", ".ogg"))]

    # Sort by numeric value, not lexicographic
    files.sort(key=get_number)

    temp_names = []

    # Step 1: rename to unique temp names
    for file in files:
        old_path = os.path.join(folder, file)
        temp_name = str(uuid.uuid4()) + os.path.splitext(file)[1]
        temp_path = os.path.join(folder, temp_name)
        os.rename(old_path, temp_path)
        temp_names.append(temp_path)

    # Step 2: rename to final names (0.wav, 1.wav, 2.wav...)
    for index, temp_path in enumerate(temp_names):
        ext = os.path.splitext(temp_path)[1]
        new_path = os.path.join(folder, f"{index}{ext}")
        os.rename(temp_path, new_path)

    print(f"Renamed files in {folder}")

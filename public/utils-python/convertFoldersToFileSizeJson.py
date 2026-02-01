import os
import json

# =====================
# CONFIGURATION
# =====================

# Virtual group names -> real folders
FOLDER_GROUPS = {
    "audio_81": [
        "../flavors/audio/out/81BPM/"
    ],
    "audio_110": [
        "../flavors/audio/out/110BPM/",
    ],
    "audio_124": [
        "../flavors/audio/out/124BPM/",
    ],
    "audio_130": [
        "../flavors/audio/out/130BPM/",
    ],
    "audio_mainFlavors": [
        "../flavors/audio/mainFlavors/"
    ],
    "images": [
        "../flavors/images/images/",
        "../flavors/images/mainFlavorsImages/"
    ],
    "currentPosFrames": [
        "../blender/outputs/CurrentPositionPlayer/"
    ]
}

OUTPUT_JSON_PATH = "../../src/@types/downloadSizes.json"

# =====================
# SCRIPT LOGIC
# =====================

def collect_grouped_file_sizes(folder_groups):
    grouped_data = {}

    for group_name, folders in folder_groups.items():
        grouped_data[group_name] = {}

        for folder in folders:
            if not os.path.isdir(folder):
                print(f"Skipping invalid folder: {folder}")
                continue

            for entry in os.scandir(folder):
                if entry.is_file():
                    name_without_ext = os.path.splitext(entry.name)[0]
                    grouped_data[group_name][name_without_ext] = entry.stat().st_size

    return grouped_data


def main():
    data = collect_grouped_file_sizes(FOLDER_GROUPS)

    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"Wrote grouped file sizes to {OUTPUT_JSON_PATH}")


if __name__ == "__main__":
    main()

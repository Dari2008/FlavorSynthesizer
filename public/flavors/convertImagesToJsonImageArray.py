import os
import base64
import json
import mimetypes

INPUT_DIR = "./images/"
OUTPUT_FILE = "flavorImages.json"

def image_files_in_dir(directory):
    supported_exts = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}
    files = []
    for filename in os.listdir(directory):
        ext = os.path.splitext(filename)[1].lower()
        if ext in supported_exts:
            files.append(filename)
    return files

def file_to_base64_url(path):
    mime_type, _ = mimetypes.guess_type(path)
    if not mime_type:
        raise ValueError(f"Could not determine MIME type for {path}")

    with open(path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")

    return f"data:{mime_type};base64,{encoded}"

def main():
    if not os.path.exists(INPUT_DIR):
        raise FileNotFoundError(f"Input directory not found: {INPUT_DIR}")

    result = {}
    for filename in image_files_in_dir(INPUT_DIR):
        file_path = os.path.join(INPUT_DIR, filename)
        result[filename.replace(".png", "")] = file_to_base64_url(file_path)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(f"Saved base64 JSON to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

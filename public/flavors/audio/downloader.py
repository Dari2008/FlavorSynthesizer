import json
import os
import urllib.request
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

JSON_FILE = "./81.json"
OUTPUT_DIR = "81RPM"
MAX_WORKERS = 20

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(JSON_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

if isinstance(data, list):
    urls = data
elif isinstance(data, dict) and "urls" in data and isinstance(data["urls"], list):
    urls = data["urls"]
else:
    raise ValueError("JSON must be a list of URLs or contain a 'urls' array")

counter_lock = Lock()
counter = 0
max_index = len(urls)

def download(url):
    global counter
    parsed = urlparse(url)
    if not os.path.basename(parsed.path):
        raise ValueError(f"Cannot determine filename from URL: {url}")

    with counter_lock:
        index = counter
        counter += 1

    output_path = os.path.join(OUTPUT_DIR, f"{index}.mp3")
    print(f"Downloading {url} -> {output_path}: ({index} / {max_index})")
    urllib.request.urlretrieve(url, output_path)

with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = [executor.submit(download, url) for url in urls]
    for future in as_completed(futures):
        future.result()

print("Download complete.")

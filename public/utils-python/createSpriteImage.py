import os
from PIL import Image
import json

# Folder containing images
folder = "../flavors/images/mainFlavorsImages"  # <-- change this to your folder path
output_image = "../sprites/mainFlavors/mainFlavors.png"
output_data = "../sprites/mainFlavors/mainFlavors.json"

# Load all images
images = []
filenames = []

for file in os.listdir(folder):
    if file.lower().endswith((".png", ".jpg", ".jpeg", ".bmp", ".gif")):
        img = Image.open(os.path.join(folder, file)).convert("RGBA")
        images.append(img)
        filenames.append(file)

if not images:
    raise ValueError("No images found in the specified folder.")

# Calculate sprite sheet size (we'll arrange images in a single row)
width = sum(img.width for img in images)
height = max(img.height for img in images)

# Create new image for sprite
sprite = Image.new("RGBA", (width, height))
positions = {}

# Paste images into sprite sheet
x_offset = 0
for img, name in zip(images, filenames):
    sprite.paste(img, (x_offset, 0))
    positions[name] = {"x": x_offset, "y": 0, "width": img.width, "height": img.height}
    x_offset += img.width

# Save sprite sheet
os.makedirs(os.path.dirname(output_image), exist_ok=True)
sprite.save(output_image)

# Save positions as JSON
os.makedirs(os.path.dirname(output_data), exist_ok=True)
with open(output_data, "w") as f:
    json.dump(positions, f, indent=4)

print(f"Sprite saved to {output_image}")
print(f"Positions saved to {output_data}")
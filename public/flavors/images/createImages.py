import json
from PIL import Image
import os

# Load flavors JSON
flavors: dict[str, list[str]] = json.load(open("../flavorColors.json"))

# Paths
mask_paths = [
    "./heap/heap.png",
    "./heap/heap_color1.png",
    "./heap/heap_color2.png"
]

# Load masks
masks = [Image.open(path).convert("RGBA") for path in mask_paths]

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    hex_color = hex_color.strip().lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def brightness_mask(img: Image.Image) -> Image.Image:
    """
    Create a mask from black & white image using brightness.
    Alpha is used only if it is > 0.
    """
    r, g, b, a = img.split()

    # Brightness from RGB (B/W image)
    brightness = r

    # Use alpha only if it exists
    brightness = Image.composite(
        brightness,
        Image.new("L", img.size, 0),
        a.point(lambda p: 0 if p == 0 else 255)
    )

    return brightness

# Ensure output folder exists
os.makedirs("./images", exist_ok=True)

# For each flavor, create one image
for name, hex_colors in flavors.items():
    # Base image
    final = Image.new("RGBA", masks[0].size, (0, 0, 0, 0))

    for i, hex_color in enumerate(hex_colors):
        rgb_color = hex_to_rgb(hex_color)

        # Create solid color image
        color_img = Image.new("RGBA", masks[i].size, rgb_color + (255,))

        # Create mask
        mask = brightness_mask(masks[i])

        # Paste the color image onto final using mask
        # This overwrites everything beneath where mask > 0
        final.paste(color_img, (0, 0), mask)

    # Save final image
    final.save(f"./images/{name}.png")

print("Done. Images saved in ./images/")

from PIL import Image
import sys

imgPath = sys.argv[1]

img = Image.open(imgPath).convert("RGB")
pixels = img.load()

width, height = img.size
out = Image.new("RGBA", (width, height))
out_pixels = out.load()

for y in range(height):
    for x in range(width):
        r, g, b = pixels[x, y]
        brightness = int(0.299 * r + 0.587 * g + 0.114 * b)
        out_pixels[x, y] = (r, g, b, brightness)

out.save(f"{imgPath.replace(".png", "")}_alpha.png")
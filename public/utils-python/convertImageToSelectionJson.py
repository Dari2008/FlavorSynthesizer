from PIL import Image
import json

# Load the image
# image_path = "../mainMenu/bg/open_shared_dish.png"  # Replace with your image path
# output = "../../src/components/imageMenu/selections/openShartedDish.json"

# image_path = "../mainMenu/bg/list_dishes.png"  # Replace with your image path
# output = "../../src/components/imageMenu/selections/listDishes.json"

# image_path = "../mainMenu/bg/create_new_dish.png"  # Replace with your image path
# output = "../../src/components/imageMenu/selections/createNewDish.json"

image_path = "../mainMenu/bg/box_dunno.png"  # Replace with your image path
output = "../../src/components/imageMenu/selections/boxDunno.json"
img = Image.open(image_path).convert("RGBA")  # Ensure image has alpha channel

width, height = img.size
pixels = img.load()

result = {}

for y in range(height):
    startX = None
    endX = None
    for x in range(width):
        _, _, _, alpha = pixels[x, y]
        if alpha != 0:
            if startX is None:
                startX = x
            endX = x
    if startX is not None and endX is not None:
        result[y] = [startX, endX]

# Save as JSON
with open(output, "w") as f:
    json.dump(result, f)

print("Done! Saved row ranges to output.json")
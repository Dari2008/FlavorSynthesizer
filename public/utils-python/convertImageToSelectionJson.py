from PIL import Image
import json

# Load the image
# image_path = "../bgs/mainMenu/open_shared_dish.png"
# output = "../../src/components/imageMenu/selections/openShartedDish.json"

# image_path = "../bgs/mainMenu/list_dishes.png"
# output = "../../src/components/imageMenu/selections/listDishes.json"

# image_path = "../bgs/mainMenu/create_new_dish.png"
# output = "../../src/components/imageMenu/selections/createNewDish.json"

image_path = "../bgs/mainMenu/restaurant.png"
output = "../../src/components/imageMenu/selections/restaurant.json"

# image_path = "../bgs/mainMenu/customFlavors.png"
# output = "../../src/components/imageMenu/selections/customFlavors.json"


img = Image.open(image_path).convert("RGBA")

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
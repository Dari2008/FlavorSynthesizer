import os
import json
import sys
from PIL import Image

potFront = Image.open("./pot_bottom.png")
potInside = Image.open("./pot_inside.png")
potTop = Image.open("./pot_top.png")

stickCount = 12
grassCount = 3
isOnlyHalf = True
isAnimationPossible = stickCount % grassCount == 0

if not isAnimationPossible:
   print("Animation is not possible")
   sys.exit()
   

sticks = [Image.open("./stick_" + str(stick + 1) + ".png") for stick in range(stickCount)]
grasses = [Image.open("./grass_" + str(grass + 1) + ".png") for grass in range(grassCount)]

def createAnimationFrame(index: int, stickIndex: int, grassIndex: int):
   stickImage = sticks[stickIndex]
   grassImage = grasses[grassIndex]

   frame = Image.new("RGBA", (64, 64))
   box = (0, 0, 64, 64)
   frame.paste(grassImage, box, grassImage)
   frame.paste(potTop, box, potTop)
   frame.paste(potInside, box, potInside)
   frame.paste(stickImage, box, stickImage)
   frame.paste(potFront, box, potFront)

   frame.save("./output/image_" + str(index) + ".png")
   frame.close()


if not os.path.exists("./output"):
    os.mkdir("./output")

count = max(stickCount, grassCount)
grassIndex = 0
stickIndex = 0
grassDir = 1
stickDir = 1
for i in range(count if not isOnlyHalf else count*2):

    if isOnlyHalf:
        if grassIndex >= grassCount:
            grassIndex = grassCount - 2
            grassDir = -1
        elif grassIndex < 0:
            grassIndex = 1
            grassDir = 1
            
        if stickIndex >= stickCount:
            stickIndex = stickCount - 2
            stickDir = -1
        elif stickIndex < 0:
            stickIndex = 1
            stickDir = 1

    else:
        if grassIndex > grassCount:
              grassIndex = 0

        if stickIndex > stickCount:
            stickIndex = 0

    createAnimationFrame(i, stickIndex, grassIndex)
    grassIndex += grassDir
    stickIndex += stickDir
            

print("Created all frames")
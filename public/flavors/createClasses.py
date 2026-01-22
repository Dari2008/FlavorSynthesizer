import os
import json


FLAVORS = json.load(open("./flavors.json"))

bpms = [
    81,
    110,
    124,
    130
]

folders = [
    "./audio/out/81BPM",
    "./audio/out/110BPM",
    "./audio/out/124BPM",
    "./audio/out/130BPM"
]

folderContents = [os.listdir(folder) for folder in folders]

smallestFolder = 1000000

for files in folderContents:
    smallestFolder = min(smallestFolder, files.__len__())

for i in range(smallestFolder):
    print(f"new FlavorFileMusic({i}, \"{FLAVORS[i]}\"),")
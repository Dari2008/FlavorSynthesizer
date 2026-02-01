import { loadAndSaveResource } from "../ResourceSaver";

var currentPosAnimationImages = (window as any).CURRENT_ANIMATIONS_IMAGES;

var imageCount = 99;
var ROOT_PATH = "./blender/outputs/CurrentPositionPlayer/";


export async function initCurrentPosImages() {

    if (!currentPosAnimationImages) {
        currentPosAnimationImages = [];

        await (async () => {
            const batchSize = 5;
            for (let i = 0; i < imageCount; i += batchSize) {
                const batch = Array.from({ length: batchSize }, (_, j) => i + j).filter(x => x < imageCount);
                await Promise.all(batch.map(async (idx) => {
                    const img = new Image();
                    img.src = await loadAndSaveResource("currentCursorPositionAnimation", "image_" + i, ROOT_PATH + i.toString().padStart(4, "0") + ".png");
                    await new Promise(res => img.onload = res);
                    currentPosAnimationImages[idx] = img;
                }));
            }
            console.log("Loaded all");

        })();
        (window as any).CURRENT_ANIMATIONS_IMAGES = currentPosAnimationImages;
    }
}
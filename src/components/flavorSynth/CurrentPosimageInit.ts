import { getResourceByName } from "../ResourceSaver";

var currentPosAnimationImages = (window as any).CURRENT_ANIMATIONS_IMAGES;

var imageCount = 99;
// var ROOT_PATH = "./blender/outputs/CurrentPositionPlayer/";


export async function initCurrentPosImages() {

    if (!currentPosAnimationImages) {
        currentPosAnimationImages = [];

        await (async () => {
            for (let i = 0; i < imageCount; i++) {
                const img = new Image();
                // , ROOT_PATH + i.toString().padStart(4, "0") + ".png"
                img.src = await getResourceByName("currentCursorPositionAnimation", "image_" + i + ".png");
                await new Promise(res => img.onload = res);
                currentPosAnimationImages[i] = img;
            }

        })();
        (window as any).CURRENT_ANIMATIONS_IMAGES = currentPosAnimationImages;
    }
}
import { loadAndSaveResource } from "../ResourceSaver";

export const LOADING_ANIMATION_IMAGES: HTMLImageElement[] = [];

export const LOADING_ANIMATION_IMAGE_COUNT = 22;

export async function initLoadingAnimation() {
    if (LOADING_ANIMATION_IMAGES.length > 0) return;
    const all = [];
    all.push(new Promise<void>(async (res, rej) => {
        for (let i = 0; i < LOADING_ANIMATION_IMAGE_COUNT; i++) {
            const image = new Image();
            image.src = await loadAndSaveResource("pot-animation", "image_" + i, "./animations/pot-animation/image_" + i + ".png");
            image.onload = () => res();
            image.onerror = () => rej();
            LOADING_ANIMATION_IMAGES.push(image);
        }
    }));
    await Promise.all(all);
}

export function setLoadingFrame(base64: string, index: number) {
    const img = new Image();
    img.src = base64;
    LOADING_ANIMATION_IMAGES[index] = img;
}
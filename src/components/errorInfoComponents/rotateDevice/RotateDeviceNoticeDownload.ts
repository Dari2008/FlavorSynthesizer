import { getResourceByName } from "../../ResourceSaver";

export const ROTATE_NOTICE_ANIMATION_IMAGES: HTMLImageElement[] = [];

export const ROTATE_NOTICE_ANIMATION_IMAGE_COUNT = 10;

export async function initRotateNotice() {
    if (ROTATE_NOTICE_ANIMATION_IMAGES.length > 0) return;
    const all = [];
    for (let i = 0; i < ROTATE_NOTICE_ANIMATION_IMAGE_COUNT; i++) {
        all.push(new Promise<void>(async (res, rej) => {
            const image = new Image();
            // , "./animations/phone/Rotation/" + i + ".png"
            image.src = await getResourceByName("rotateDevice", "image_" + i + ".png");
            image.onload = () => res();
            image.onerror = () => rej();
            ROTATE_NOTICE_ANIMATION_IMAGES.push(image);
        }));
    }
    await Promise.allSettled(all);
}

export function setLoadingFrameRotateNotice(base64: string, index: number) {
    const img = new Image();
    img.src = base64;
    ROTATE_NOTICE_ANIMATION_IMAGES[index] = img;
}
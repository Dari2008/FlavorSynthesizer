import FILE_SIZES_RAW from "../@types/downloadSizes.json";
import FILE_SIZES_IMAGES_RAW from "../@types/downloadImageSizes.json";
import type { BPM } from "../audio/FlavorMusic";
import { FLAVORS, MAIN_FLAVORS } from "../audio/Flavors";
import { LOADING_ANIMATION_IMAGE_COUNT, setLoadingFrame } from "../components/loading/LoadingAnimationDownloads";
import { loadAndSaveResource } from "../components/ResourceSaver";
import { IMAGES_TO_LOAD, loadImage, type ImageName } from "./ImageDownloadManager";
const FILE_SIZES = FILE_SIZES_RAW as FileSizes;
const FILE_SIZES_IMAGES = FILE_SIZES_IMAGES_RAW as ImageFileSizes;

let startTime = 0;
let timeTaken = 0;

export const DOWNLOAD_PROGRESS_KEY = "downloadProgress";



function downloadStart() {
    startTime = performance.now();
}

function downloadEnd(downloadSize: number): number {
    timeTaken = performance.now() - startTime;
    return downloadSize / (timeTaken / 1000);
}
var CURRENT_POS_ANIMATION_FRAME_COUNT = 99;


async function downloadCurrentPosAnimationFrame(frame: number) {
    var ROOT_PATH = "./blender/outputs/CurrentPositionPlayer/";
    await loadAndSaveResource("currentCursorPositionAnimation", "image_" + frame, ROOT_PATH + frame.toString().padStart(4, "0") + ".png");
}

async function downloadLoadingAnimationFrame(frame: number) {
    setLoadingFrame(await loadAndSaveResource("pot-animation", "image_" + frame, "./animations/pot-animation/image_" + frame + ".png"), frame);
}

export async function downloadAll(onProgress: (max: number, curr: number, downloadSize: number, downloadedSize: number, mbSec: number) => void) {
    const max = MAIN_FLAVORS.length + (FLAVORS.length * 4) + CURRENT_POS_ANIMATION_FRAME_COUNT + LOADING_ANIMATION_IMAGE_COUNT + Object.keys(IMAGES_TO_LOAD).length;
    let curr = 0;
    let downloadedContentSize = 0;
    let maxDownloadedContent = calculateMaxDownloadSize();
    let downloadProgress = parseInt(localStorage.getItem(DOWNLOAD_PROGRESS_KEY) ?? "0");
    let downloadProgressSubtractedAllready = 0;

    const updateProgress = () => {
        localStorage.setItem(DOWNLOAD_PROGRESS_KEY, curr + "");
    };

    for (let i = 0; i < LOADING_ANIMATION_IMAGE_COUNT; i++) {
        const size = getSizeOf("pot-animation", "image_" + i);
        if (downloadProgress > downloadProgressSubtractedAllready) {
            downloadProgressSubtractedAllready++;
            curr++
            downloadedContentSize += size;
            continue;
        }
        downloadStart();
        await downloadLoadingAnimationFrame(i);
        const sizePerSec = downloadEnd(size);
        downloadedContentSize += size;
        onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
        curr++
        updateProgress();
    }

    for (const key of Object.keys(IMAGES_TO_LOAD) as ImageName[]) {
        const size = getSizeOfImage(key);
        if (downloadProgress > downloadProgressSubtractedAllready) {
            downloadProgressSubtractedAllready++;
            curr++
            downloadedContentSize += size;
            continue;
        }
        downloadStart();
        await loadImage(key);
        const sizePerSec = downloadEnd(size);
        downloadedContentSize += size;
        onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
        curr++;
        updateProgress();
    }

    for (const mainFlavor of MAIN_FLAVORS) {
        const size = getSizeOf("audio_mainFlavors", mainFlavor.NAME.toLowerCase() + "");
        if (downloadProgress > downloadProgressSubtractedAllready) {
            downloadProgressSubtractedAllready++;
            curr++
            downloadedContentSize += size;
            continue;
        }
        downloadStart();
        await mainFlavor.download();
        const sizePerSec = downloadEnd(size);
        downloadedContentSize += size;
        onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
        curr++;
        updateProgress();
    }

    for (const flavor of FLAVORS) {
        for (const bpm of BPM_VALS) {
            const size = getSizeOf("audio_" + bpm, flavor.index + "");
            if (downloadProgress > downloadProgressSubtractedAllready) {
                downloadProgressSubtractedAllready++;
                curr++
                downloadedContentSize += size;
                continue;
            }
            downloadStart();
            await flavor.downloadSingle(bpm as BPM);
            const sizePerSec = downloadEnd(size);
            downloadedContentSize += size;
            onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
            curr++
            updateProgress();
        }
    }

    for (let i = 0; i < CURRENT_POS_ANIMATION_FRAME_COUNT; i++) {
        const size = getSizeOf("currentPosFrames", (i + "").padStart(4, "0"));
        if (downloadProgress > downloadProgressSubtractedAllready) {
            downloadProgressSubtractedAllready++;
            curr++
            downloadedContentSize += size;
            continue;
        }
        downloadStart();
        await downloadCurrentPosAnimationFrame(i);
        const sizePerSec = downloadEnd(size);
        downloadedContentSize += size;
        onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
        updateProgress();
        curr++
    }
    onProgress(max, max, maxDownloadedContent, maxDownloadedContent, 0);
    localStorage.removeItem(DOWNLOAD_PROGRESS_KEY);
}

function calculateMaxDownloadSize() {
    let size = 0;
    for (const mainFlavor of MAIN_FLAVORS) {
        size += getSizeOf("audio_mainFlavors", mainFlavor.NAME.toLowerCase() + "");
    }


    for (const flavor of FLAVORS) {
        for (const bpm of BPM_VALS) {
            size += getSizeOf("audio_" + bpm, flavor.index + "");
        }
    }

    for (let i = 0; i < CURRENT_POS_ANIMATION_FRAME_COUNT; i++) {
        size += getSizeOf("currentPosFrames", (i + "").padStart(4, "0"));
    }
    return size;
}

function getSizeOf(mainGroup: string, fileName: string): number {
    if (!FILE_SIZES[mainGroup][fileName]) {
        console.log(mainGroup, fileName);
        return 0;
    }
    return FILE_SIZES[mainGroup][fileName];
}

function getSizeOfImage(name: ImageName): number {
    if (!FILE_SIZES_IMAGES[name]) {
        console.log(name);
        return 0;
    }
    return FILE_SIZES_IMAGES[name];
}

const BPM_VALS = [
    81,
    110,
    124,
    130
]

export type FileSizes = {
    [key: string]: {
        [key: string]: number;
    };
};

export type ImageFileSizes = {
    [key in ImageName]: number;
};
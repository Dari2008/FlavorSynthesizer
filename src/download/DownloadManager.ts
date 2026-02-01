import FILE_SIZES_RAW from "../@types/downloadSizes.json";
import type { BPM } from "../audio/FlavorMusic";
import { FLAVORS, MAIN_FLAVORS } from "../audio/Flavors";
import { loadAndSaveResource } from "../components/ResourceSaver";
const FILE_SIZES = FILE_SIZES_RAW as FileSizes;

let startTime = 0;
let timeTaken = 0;




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

export async function downloadAll(onProgress: (max: number, curr: number, downloadSize: number, downloadedSize: number, mbSec: number) => void) {
    const max = MAIN_FLAVORS.length + (FLAVORS.length * 4) + CURRENT_POS_ANIMATION_FRAME_COUNT;
    let curr = 0;
    let downloadedContentSize = 0;
    let maxDownloadedContent = calculateMaxDownloadSize();
    for (const mainFlavor of MAIN_FLAVORS) {
        downloadStart();
        await mainFlavor.download();
        const size = getSizeOf("audio_mainFlavors", mainFlavor.NAME.toLowerCase() + "");
        const sizePerSec = downloadEnd(size);
        downloadedContentSize += size;
        onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
        curr++;
    }

    for (const flavor of FLAVORS) {
        for (const bpm of BPM_VALS) {
            downloadStart();
            await flavor.downloadSingle(bpm as BPM);
            const size = getSizeOf("audio_" + bpm, flavor.index + "");
            const sizePerSec = downloadEnd(size);
            downloadedContentSize += size;
            onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
            curr++
        }
    }

    for (let i = 0; i < CURRENT_POS_ANIMATION_FRAME_COUNT; i++) {
        downloadStart();
        await downloadCurrentPosAnimationFrame(i);
        const size = getSizeOf("currentPosFrames", (i + "").padStart(4, "0"));
        const sizePerSec = downloadEnd(size);
        downloadedContentSize += size;
        onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
        curr++
    }
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
    if (!FILE_SIZES[mainGroup][fileName]) console.log(mainGroup, fileName);
    return FILE_SIZES[mainGroup][fileName];
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
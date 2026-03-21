// import FILE_SIZES_RAW from "../@types/downloadSizes.json";
import { setLoadingFrame } from "../components/loading/LoadingAnimationDownloads";
import { saveResourceWithName } from "../components/ResourceSaver";
import { setLoadingFrameRotateNotice } from "../components/errorInfoComponents/rotateDevice/RotateDeviceNoticeDownload";
import { Network } from "../utils/Network";
import type JSZip from "jszip";
import Utils from "../utils/Utils";
// const FILE_SIZES = FILE_SIZES_RAW as FileSizes;

// let startTime = 0;
// let timeTaken = 0;

export const DOWNLOAD_GROUP_COUNT = 4;

export const DOWNLOAD_PROGRESS_KEY = "downloadProgress";



// function downloadStart() {
//     startTime = performance.now();
// }

// function downloadEnd(downloadSize: number): number {
//     timeTaken = performance.now() - startTime;
//     return downloadSize / (timeTaken / 1000);
// }
// var CURRENT_POS_ANIMATION_FRAME_COUNT = 99;


// async function downloadCurrentPosAnimationFrame(frame: number) {
//     // var ROOT_PATH = "./blender/outputs/CurrentPositionPlayer/";
//     // await loadAndSaveResource("currentCursorPositionAnimation", "image_" + frame, ROOT_PATH + frame.toString().padStart(4, "0") + ".png");
// }

async function downloadLoadingAnimationFrame(base64: string, number: number) {
    setLoadingFrame(base64, number);
}

async function downloadRotateNoticeAnimationFrame(base64: string, number: number) {
    setLoadingFrameRotateNotice(base64, number);
}

export async function downloadAll(onProgress: (max: number, curr: number, downloadSize: number, downloadedSize: number, mbSec: number) => void) {

    let lastProgress = 0;
    let lastTime = Date.now();
    let lastDownloadPerSec = 0;

    const success = await Network.loadZip("./content/gameContent.zip", {
        method: "GET"
    }, onProgressWrapper, onFileLoaded);

    if (!success) {
        Utils.error("Failed to download game data");
        return;
    }

    function onProgressWrapper(progress: number, total: number) {
        const now = Date.now();

        const bytesDiff = progress - lastProgress;
        const timeDiff = now - lastTime;

        if (timeDiff > 0) {
            lastDownloadPerSec = bytesDiff / (timeDiff / 1000);
        }

        lastProgress = progress;
        lastTime = now;

        onProgress(total, progress, total, progress, lastDownloadPerSec);
        console.log(total, progress, lastDownloadPerSec);
    }

    async function onFileLoaded(relativePath: string, file: JSZip.JSZipObject) {
        const base64 = await file.async("base64");

        const parts = relativePath.split("/");
        const dbName = parts[1];
        const fileName = parts[2];
        if (!fileName || fileName.length === 0) return;

        const mimeType = getMimeType(fileName);
        const dataUrl = `data:${mimeType};base64,${base64}`;

        console.log(dbName, fileName);

        if (dbName == "pot-animation" || dbName == "rotateDevice") {
            const index = parseInt(fileName.split(".")[0]);

            if (dbName == "pot-animation") {
                downloadLoadingAnimationFrame(dataUrl, index);
            } else {
                downloadRotateNoticeAnimationFrame(dataUrl, index);
            }
        }

        await saveResourceWithName(dbName, fileName, dataUrl);
    }

    function getMimeType(name: string) {
        const ext = name.split(".").pop()?.toLowerCase();
        switch (ext) {
            case "png": return "image/png";
            case "jpg":
            case "jpeg": return "image/jpeg";
            case "gif": return "image/gif";
            case "webp": return "image/webp";
            case "svg": return "image/svg+xml";
            case "json": return "application/json";
            case "txt": return "text/plain";
            case "wav": return "audio/wav";
            case "mp3": return "audio/mp3";
            default: return "application/octet-stream";
        }
    }


    // const max = MAIN_FLAVORS.length + (FLAVORS.length * 4) + CURRENT_POS_ANIMATION_FRAME_COUNT + LOADING_ANIMATION_IMAGE_COUNT + ROTATE_NOTICE_ANIMATION_IMAGE_COUNT;
    // let curr = 0;
    // let downloadedContentSize = 0;
    // let maxDownloadedContent = calculateMaxDownloadSize();
    // let downloadProgress = parseInt(localStorage.getItem(DOWNLOAD_PROGRESS_KEY) ?? "0");
    // let downloadProgressSubtractedAllready = 0;

    // const updateProgress = () => {
    //     localStorage.setItem(DOWNLOAD_PROGRESS_KEY, curr + "");
    // };

    // for (let i = 0; i < LOADING_ANIMATION_IMAGE_COUNT; i++) {
    //     const size = getSizeOf("pot-animation", "image_" + i);
    //     if (downloadProgress > downloadProgressSubtractedAllready) {
    //         downloadProgressSubtractedAllready++;
    //         curr++
    //         downloadedContentSize += size;
    //         continue;
    //     }
    //     downloadStart();
    //     await downloadLoadingAnimationFrame(i);
    //     const sizePerSec = downloadEnd(size);
    //     downloadedContentSize += size;
    //     onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
    //     curr++
    //     updateProgress();
    // }

    // for (let i = 0; i < ROTATE_NOTICE_ANIMATION_IMAGE_COUNT; i++) {
    //     const size = getSizeOf("rotateDevice", "" + i);
    //     if (downloadProgress > downloadProgressSubtractedAllready) {
    //         downloadProgressSubtractedAllready++;
    //         curr++
    //         downloadedContentSize += size;
    //         continue;
    //     }
    //     downloadStart();
    //     await downloadRotateNoticeAnimationFrame(i);
    //     const sizePerSec = downloadEnd(size);
    //     downloadedContentSize += size;
    //     onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
    //     curr++
    //     updateProgress();
    // }

    // // for (const key of Object.keys(IMAGES_TO_LOAD) as ImageName[]) {
    // //     const size = getSizeOfImage(key);
    // //     if (downloadProgress > downloadProgressSubtractedAllready) {
    // //         downloadProgressSubtractedAllready++;
    // //         curr++
    // //         downloadedContentSize += size;
    // //         continue;
    // //     }
    // //     downloadStart();
    // //     await loadImage(key);
    // //     const sizePerSec = downloadEnd(size);
    // //     downloadedContentSize += size;
    // //     onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
    // //     curr++;
    // //     updateProgress();
    // // }

    // for (const mainFlavor of MAIN_FLAVORS) {
    //     const size = getSizeOf("audio_mainFlavors", mainFlavor.NAME.toLowerCase() + "");
    //     if (downloadProgress > downloadProgressSubtractedAllready) {
    //         downloadProgressSubtractedAllready++;
    //         curr++
    //         downloadedContentSize += size;
    //         continue;
    //     }
    //     downloadStart();
    //     await mainFlavor.download();
    //     const sizePerSec = downloadEnd(size);
    //     downloadedContentSize += size;
    //     onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
    //     curr++;
    //     updateProgress();
    // }

    // for (const flavor of FLAVORS) {
    //     // for (const bpm of BPM_VALS) {
    //     const size = getSizeOf("audio_" + 110, flavor.index + "");
    //     if (downloadProgress > downloadProgressSubtractedAllready) {
    //         downloadProgressSubtractedAllready++;
    //         curr++
    //         downloadedContentSize += size;
    //         continue;
    //     }
    //     downloadStart();
    //     await flavor.downloadSingle(110 as BPM);
    //     const sizePerSec = downloadEnd(size);
    //     downloadedContentSize += size;
    //     onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
    //     curr++
    //     updateProgress();
    //     // }
    // }

    // for (let i = 0; i < CURRENT_POS_ANIMATION_FRAME_COUNT; i++) {
    //     const size = getSizeOf("currentPosFrames", (i + "").padStart(4, "0"));
    //     if (downloadProgress > downloadProgressSubtractedAllready) {
    //         downloadProgressSubtractedAllready++;
    //         curr++
    //         downloadedContentSize += size;
    //         continue;
    //     }
    //     downloadStart();
    //     await downloadCurrentPosAnimationFrame(i);
    //     const sizePerSec = downloadEnd(size);
    //     downloadedContentSize += size;
    //     onProgress(max, curr, maxDownloadedContent, downloadedContentSize, sizePerSec);
    //     updateProgress();
    //     curr++
    // }
    // onProgress(max, max, maxDownloadedContent, maxDownloadedContent, 0);
    // localStorage.removeItem(DOWNLOAD_PROGRESS_KEY);
}

// function calculateMaxDownloadSize() {
//     let size = 0;
//     for (const mainFlavor of MAIN_FLAVORS) {
//         size += getSizeOf("audio_mainFlavors", mainFlavor.NAME.toLowerCase() + "");
//     }


//     for (let i = 0; i < LOADING_ANIMATION_IMAGE_COUNT; i++) {
//         size += getSizeOf("pot-animation", "image_" + i);
//     }


//     for (let i = 0; i < ROTATE_NOTICE_ANIMATION_IMAGE_COUNT; i++) {
//         size += getSizeOf("rotateDevice", "" + i);
//     }

//     for (const flavor of FLAVORS) {
//         // for (const bpm of BPM_VALS) {
//         size += getSizeOf("audio_" + 110, flavor.index + "");
//         // }
//     }

//     for (let i = 0; i < CURRENT_POS_ANIMATION_FRAME_COUNT; i++) {
//         size += getSizeOf("currentPosFrames", (i + "").padStart(4, "0"));
//     }
//     return size;
// }

// function getSizeOf(mainGroup: string, fileName: string): number {
//     if (!FILE_SIZES[mainGroup]) {
//         console.error(mainGroup, fileName);
//         return 0;
//     }
//     if (!FILE_SIZES[mainGroup][fileName]) {
//         console.error(mainGroup, fileName);
//         return 0;
//     }
//     console.log(mainGroup, fileName);
//     return FILE_SIZES[mainGroup][fileName];
// }

// const BPM_VALS = [
//     81,
//     110,
//     124,
//     130
// ]

export type FileSizes = {
    [key: string]: {
        [key: string]: number;
    };
};
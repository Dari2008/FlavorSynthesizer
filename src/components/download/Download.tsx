import { useRef, useState } from "react";
import { useLoadingAnimation } from "../../contexts/LoadingAnimationContext";
import { downloadAll } from "../../download/DownloadManager";
import "./Download.scss";
import PixelDiv from "../pixelDiv/PixelDiv";

export default function Download({ hasDownloadedAssets, downloadFinished, hasLoaded }: {
    hasDownloadedAssets: boolean;
    downloadFinished: () => void;
    hasLoaded: boolean;
}) {
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [isSuccessfullDownload, setIsSuccessfullDownload] = useState<boolean>(false);
    const progressLabelRef = useRef<HTMLSpanElement>(null);
    const currentDownloadingProgressRef = useRef<HTMLDivElement>(null);

    const downloadingLoading = useLoadingAnimation().withKey("downloadData");
    const download = () => {
        if (hasDownloadedAssets) return;
        setIsDownloading(true);
        downloadingLoading.startLoading();
        downloadAll((max, curr, maxSize, size, mbSec) => {
            // setDownloadProgres({
            //     max: max,
            //     val: curr,
            //     maxSize,
            //     size,
            //     mbSec
            // });
            setIsDownloading(true);
            if (curr >= max) {
                setIsDownloading(false);
                setIsSuccessfullDownload(true);
                setTimeout(() => {
                    downloadFinished();
                }, 1000);
            }
            if (progressLabelRef.current) {
                progressLabelRef.current.textContent = `${(size / 1000 / 1000).toFixed(1)} MB / ${(maxSize / 1000 / 1000).toFixed(1)} MB (${(mbSec / 1000 / 1000).toFixed(1)} MB/s)`;
            }
            if (currentDownloadingProgressRef.current) {
                currentDownloadingProgressRef.current.style.setProperty("--progress-percentage", (size / maxSize) * 100 + "%");
            }
        }).then(() => downloadingLoading.stopLoading());
    };
    return <>
        {!hasDownloadedAssets && hasLoaded && <div className="download-prompt">
            {!(isDownloading && !isSuccessfullDownload) &&
                <div className="has-to-download">
                    <h3>Download Assets</h3>
                    <span>You have to download the assets of the game if you want to play it</span>
                    {!isDownloading && !isSuccessfullDownload && <button className="download" onClick={download}>Download</button>}
                    {
                        isSuccessfullDownload && <>
                            <h2 className="successfull-download">Downloaded Successfully</h2>
                        </>
                    }
                </div>}

            {
                isDownloading && !isSuccessfullDownload && <>
                    <PixelDiv className="progress-bar" bgColor="#212121" role="progressbar" ref={currentDownloadingProgressRef}>
                        <PixelDiv className="progress" bgColor="#540863">
                        </PixelDiv>
                        {/* <div className="progress">
                            <div className="left"></div>
                            <div className="center"></div>
                            <div className="right"></div>
                        </div> */}
                        <span className="label" ref={progressLabelRef}>0 MB / 0 MB (0 MB/s)</span>
                    </PixelDiv>
                </>
            }
        </div>
        }

    </>
}
import { useEffect, useRef } from "react";
import "./Loading.scss";
import { LOADING_ANIMATION_IMAGE_COUNT, LOADING_ANIMATION_IMAGES } from "./LoadingAnimationDownloads";


export default function Loading() {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const animationLength = 1400;
        const frameCount = LOADING_ANIMATION_IMAGE_COUNT;

        let startTime: number | null = null;
        let animationFrameId: number;

        const render = (timestamp: number) => {
            if (!startTime) startTime = timestamp;

            const elapsed = timestamp - startTime;
            const progress = elapsed % animationLength;

            const index = Math.floor(
                (progress / animationLength) * frameCount
            );

            if (LOADING_ANIMATION_IMAGES[index]) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(
                    LOADING_ANIMATION_IMAGES[index],
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
            }


            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => cancelAnimationFrame(animationFrameId);

    }, [canvasRef.current]);

    return <div className="loading-div">
        <canvas className="loading-animation" ref={canvasRef} width={64} height={64} />
        <span className="loading-span">Loading</span>
    </div>
}
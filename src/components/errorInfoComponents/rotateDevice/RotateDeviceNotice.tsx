import { useEffect, useRef } from "react"
import { ROTATE_NOTICE_ANIMATION_IMAGE_COUNT, ROTATE_NOTICE_ANIMATION_IMAGES } from "./RotateDeviceNoticeDownload";
import "./RotateDeviceNotice.scss";

export default function RotateDeviceNotice() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const animationLength = 2000;
        const frameCount = ROTATE_NOTICE_ANIMATION_IMAGE_COUNT;

        let startTime: number | null = null;
        let animationFrameId: number;

        const render = (timestamp: number) => {
            if (!startTime) startTime = timestamp;

            const elapsed = timestamp - startTime;
            const progress = elapsed % animationLength;

            const index = Math.floor(
                (progress / animationLength) * frameCount
            );

            if (ROTATE_NOTICE_ANIMATION_IMAGES[index]) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(
                    ROTATE_NOTICE_ANIMATION_IMAGES[index],
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


    return <div className="rotate-device-notice">
        <canvas width={128} height={128} ref={canvasRef}>Please Rotate the device</canvas>
        <span>Please Rotate the device</span>
    </div>
}
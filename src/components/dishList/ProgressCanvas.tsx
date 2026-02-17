import React, { useEffect, useRef, type ReactNode } from "react"

export default function ProgressCanvas({ progress, maxProgress, progressChangeRef, color, ...rest }: React.HTMLAttributes<HTMLCanvasElement> & { progress: number; maxProgress: number; progressChangeRef?: React.RefObject<(progress: number) => void>; color: string; }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const part = maxProgress / 4;

    useEffect(() => {

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;
            const barWidth = Math.min(width / 2, height / 2) / 6;

            const totalPixels = width * 2 + height * 2;
            const normProgress = progress / maxProgress;
            const pixels = totalPixels * normProgress;

            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = color;

            if (pixels >= 0) {
                const size = clamp(pixels, 0, width);
                ctx.fillRect(0, 0, size, barWidth);
            }

            if (pixels >= width) {
                const size = clamp(pixels, width, (width + height)) - width;
                ctx.fillRect(width - barWidth, 0, barWidth, size);
            }

            if (pixels >= width + height) {
                const size = clamp(pixels, (width + height), (width + height + width)) - (width + height);
                ctx.fillRect(width - size, height - barWidth, size, barWidth);
            }


            if (pixels >= width + height + width) {
                const size = clamp(pixels, (width + height + width), (width + height + width + height)) - (width + height + width);
                ctx.fillRect(0, height - size, barWidth, size);
            }


        };

        render();

        const resizeListener = new ResizeObserver(() => {
            render();
        });
        resizeListener.observe(canvas);

        if (progressChangeRef) {
            progressChangeRef.current = (p) => {
                progress = p;
                render();
            }
        }


    }, []);

    return <canvas width={300} height={75} ref={canvasRef} {...rest}></canvas>;
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(Math.min(val, max), min);
}
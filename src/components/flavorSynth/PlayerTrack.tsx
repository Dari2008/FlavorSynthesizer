import { useEffect, useRef, useState } from "react"
import { useSynthLines } from "../../contexts/SynthLinesContext";
import type { CurrentSpan } from "./FlavorSynth";
import { FLAVOR_COLOR, FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";

export default function PlayerTrack({ width, currentScrolledRef }: { width: number, currentScrolledRef: React.RefObject<CurrentSpan> }) {
    const synthLines = useSynthLines();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const height = 85;

    const elements = useRef<FlavorElement[]>([{
        flavor: {
            colors: FLAVOR_COLOR["Almond"],
            image: FLAVOR_IMAGES["Almond"],
            name: "Almond"
        },
        from: 0,
        to: 10
    }]);

    const render = () => {
        const span = currentScrolledRef.current;
        if (!span) return;
        const secondsBetween = span.to - span.from;
        const pixelsPerSecond = width / secondsBetween;
        if (secondsBetween <= 0) return;
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);


        const STROKES_COLORS = "white";
        const UNIT = "s";

        const LINE_MARKER_HEIGHT = 10;
        const LINE_Y = 30;

        const offsetX = span.from * pixelsPerSecond;

        ctx.strokeStyle = STROKES_COLORS;
        ctx.lineWidth = 1;
        // ctx.beginPath();
        // ctx.moveTo(0, LINE_Y);
        // ctx.lineTo(width, LINE_Y);
        // ctx.closePath();
        // ctx.stroke();

        for (let i = Math.floor(span.from); i <= span.to; i++) {
            const x = i * pixelsPerSecond - offsetX;
            const time = Math.floor(i);
            ctx.beginPath();
            const extrSize = time % 10 == 0 ? 8 : 0;
            ctx.moveTo(x, LINE_Y - LINE_MARKER_HEIGHT / 2 - extrSize / 2);
            ctx.lineTo(x, LINE_Y + LINE_MARKER_HEIGHT / 2 + extrSize / 2);
            ctx.closePath();
            ctx.stroke();

            if (time % 10 == 0) {
                ctx.fillStyle = "white";
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.fillText(time + UNIT, x, LINE_Y / 2);
            }

            if (time % 5 == 0 && time % 10 != 0) {
                ctx.fillStyle = "rgb(125, 125, 125)";
                ctx.font = "10px Arial";
                ctx.textAlign = "center";
                ctx.fillText(time + UNIT, x, LINE_Y / 2);
            }

        }

        for (const element of elements.current) {

        }

    };


    useEffect(() => {
        let running = true;

        const loop = () => {
            if (!running) return;
            render();
            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);

        return () => {
            running = false;
        };
    }, [width]);

    const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        synthLines.onWheel(e);
    };

    return <canvas style={{ touchAction: "none" }} width={width} height={height} ref={canvasRef} onWheel={e => onWheel(e)}></canvas>
}

function parseTime(time: string): number {
    const parts = time.split(":");
    console.log(parts);
    switch (parts.length) {
        case 1:
            return parseInt(parts[0]);
        case 2:
            return parseInt(parts[1]) + parseInt(parts[0]) * 60;
        case 3:
            return parseInt(parts[2]) + parseInt(parts[1]) * 60 + parseInt(parts[0]) * 60 * 60;
    }
    return -1;
}

export type FlavorElement = {
    from: number;
    to: number;
    flavor: FlavorData;
}

export type FlavorData = {
    name: Flavor;
    image: string;
    colors: string[];
}
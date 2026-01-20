import { useEffect, useRef, useState } from "react"
import { useSynthLines } from "../../contexts/SynthLinesContext";
import type { CurrentSpan } from "./FlavorSynth";
import { FLAVOR_COLOR, FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";

export default function PlayerTrack({ width, currentScrolledRef }: { width: number, currentScrolledRef: React.RefObject<CurrentSpan> }) {
    const synthLines = useSynthLines();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePosRef = useRef<{ x: number; y: number; }>({ x: -1, y: -1 });
    const height = 85;

    const elements = useRef<FlavorElement[]>([
        createElementForFlavor("Almond", 0, 10),
        createElementForFlavor("Mango", 10, 20)
    ]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        let isMouseDown = false;

        const onMouseMoveUpdate = (e: MouseEvent) => {
            const span = currentScrolledRef.current;
            if (!span) return;
            const secondsBetween = span.to - span.from;
            const pixelsPerSecond = width / secondsBetween;

            const offsetX = span.from * pixelsPerSecond;
            const mouse = mousePosRef.current;


            let foundOneWhereMouseOver = false;
            for (const element of elements.current) {
                const fromPos = element.from * pixelsPerSecond;
                const toPos = element.to * pixelsPerSecond;


                foundOneWhereMouseOver = foundOneWhereMouseOver || updateCursorForElement();

                function updateCursorForElement() {
                    if (!(mouse.x >= convertTimelineXToScreen(fromPos) && mouse.x <= convertTimelineXToScreen(toPos))) return false;
                    const TOLERANCE = 5;
                    if (mouse.x >= convertTimelineXToScreen(fromPos) && mouse.x <= convertTimelineXToScreen(fromPos) + TOLERANCE) {
                        canvas.style.cursor = "w-resize";
                    } else if (mouse.x >= convertTimelineXToScreen(toPos) - TOLERANCE && mouse.x <= convertTimelineXToScreen(toPos)) {
                        canvas.style.cursor = "w-resize";
                    } else {
                        canvas.style.cursor = "move";
                    }
                    return true;
                }

            }
            if (!foundOneWhereMouseOver) {
                canvas.style.cursor = "default";
            }

            function convertTimelineXToScreen(x: number) {
                return x - offsetX;
            }
        };

        let currentlyResizing: null | FlavorElement = null;
        let action: "move" | "resizeL" | "resizeR" = "move";
        let startPosition = -1;
        let startPositionOfElement = -1;
        let moveStartOffsetToEnd = -1;

        const onDragStart = (e: MouseEvent) => {
            const span = currentScrolledRef.current;
            if (!span) return;
            const secondsBetween = span.to - span.from;
            const pixelsPerSecond = width / secondsBetween;

            const offsetX = span.from * pixelsPerSecond;
            const mouse = mousePosRef.current;


            let foundOneWhereMouseOver = false;
            for (const element of elements.current) {
                const fromPos = element.from * pixelsPerSecond;
                const toPos = element.to * pixelsPerSecond;


                foundOneWhereMouseOver = foundOneWhereMouseOver || updateCursorForElement();

                function updateCursorForElement() {
                    if (!(mouse.x >= convertTimelineXToScreen(fromPos) && mouse.x <= convertTimelineXToScreen(toPos))) return false;
                    const TOLERANCE = 5;
                    console.log(mouse, convertTimelineXToScreen(fromPos), convertTimelineXToScreen(toPos));
                    if (mouse.x >= convertTimelineXToScreen(fromPos) && mouse.x <= convertTimelineXToScreen(fromPos) + TOLERANCE) {
                        action = "resizeL";
                        currentlyResizing = element;
                    } else if (mouse.x >= convertTimelineXToScreen(toPos) - TOLERANCE && mouse.x <= convertTimelineXToScreen(toPos)) {
                        action = "resizeR";
                        currentlyResizing = element;
                    } else {
                        action = "move";
                        currentlyResizing = element;
                        startPosition = mouse.x;
                        startPositionOfElement = element.from;
                        moveStartOffsetToEnd = calculateCurrentPosSeconds(mouse.x) - element.from;
                    }
                    return true;
                }

            }
            if (!foundOneWhereMouseOver) {
                canvas.style.cursor = "default";
            }


            function calculateCurrentPosSeconds(x: number) {
                const timelineX = convertScreenXToTimeline(x);
                const seconds = timelineX / pixelsPerSecond;
                return Math.round(seconds);
            }

            function convertScreenXToTimeline(x: number) {
                return x + offsetX;
            }

            function convertTimelineXToScreen(x: number) {
                return x - offsetX;
            }
        };

        const onDrag = (e: MouseEvent) => {
            console.log(e);
            if (!currentlyResizing) return;
            if (action == "move" && startPosition == -1) return;
            const span = currentScrolledRef.current;
            if (!span) return;
            const secondsBetween = span.to - span.from;
            const pixelsPerSecond = width / secondsBetween;

            const offsetX = span.from * pixelsPerSecond;
            const mouse = mousePosRef.current;

            const fromPos = currentlyResizing.from * pixelsPerSecond;
            const toPos = currentlyResizing.to * pixelsPerSecond;

            const currentPos = calculateCurrentPosSeconds(mouse.x);
            console.log(currentPos);

            switch (action) {
                case "move":
                    const delta = (currentPos - moveStartOffsetToEnd) - startPositionOfElement;
                    const size = currentlyResizing.to - currentlyResizing.from;
                    currentlyResizing.from = startPositionOfElement + delta;
                    currentlyResizing.to = currentlyResizing.from + size;
                    break;
                case "resizeL":
                    currentlyResizing.from = currentPos;
                    break;
                case "resizeR":
                    currentlyResizing.to = currentPos;
                    break;
            }

            function calculateCurrentPosSeconds(x: number) {
                const timelineX = convertScreenXToTimeline(x);
                const seconds = timelineX / pixelsPerSecond;
                return Math.round(seconds);
            }

            function convertScreenXToTimeline(x: number) {
                return x + offsetX;
            }

        };

        const onMouseMove = (e: MouseEvent) => {
            mousePosRef.current = {
                x: e.x,
                y: e.y
            };
            if (isMouseDown) {
                onDrag(e);
            } else {
                onMouseMoveUpdate(e);
            }
        }

        const onMouseDown = (e: MouseEvent) => {
            isMouseDown = true;
            onDragStart(e);
        };

        const onMouseUp = () => {
            isMouseDown = false;
        };

        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);

        return () => {
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mouseup", onMouseUp);
        };

    }, [canvasRef.current]);

    const render = () => {
        const span = currentScrolledRef.current;
        if (!span) return;
        const secondsBetween = span.to - span.from;
        const pixelsPerSecond = width / secondsBetween;
        if (secondsBetween <= 0) return;
        const canvas = canvasRef.current!;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        clearCanvas();
        const mouse = mousePosRef.current;


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
            const fromPos = element.from * pixelsPerSecond;
            const toPos = element.to * pixelsPerSecond;
            const width = toPos - fromPos;
            const marginBetween = 10;
            const imageMargin = 10;
            const rectHeight = height - LINE_Y - marginBetween
            const y = LINE_Y + 10;
            const imageSize = Math.min(width - imageMargin * 2, rectHeight - imageMargin * 2);
            fillRoundedRect(fromPos, y, width, rectHeight, 10, element.flavor.bgColor);

            fillRoundedRect(fromPos + imageMargin / 2, y + imageMargin / 2, imageSize + imageMargin, imageSize + imageMargin, 10, "rgb(40, 40, 40)");

            ctx.drawImage(element.flavor.imageObj, fromPos + imageMargin, y + imageMargin, imageSize, imageSize);

            const textX = imageSize + imageMargin * 2 + fromPos;
            ctx.textBaseline = "middle";
            ctx.textAlign = "left";
            ctx.font = "15px Arial";
            ctx.fillStyle = element.flavor.contrastColor;
            ctx.fillText(element.flavor.name, textX + 5, y + rectHeight / 2);


        }

        function convertTimelineXToScreen(x: number) {
            return x - offsetX;
        }

        function clearCanvas() {
            if (ctx) {
                ctx.clearRect(0, 0, width, height);
            }
        }

        function drawRect(x: number, y: number, width: number, height: number, color: string = "black") {
            if (ctx) {
                ctx.fillStyle = color;
                ctx.rect(x, y, width, height);
            }
        }

        function drawCircle(x: number, y: number, radius: number, color: string = "black") {
            if (ctx) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        function drawLine(x1: number, y1: number, x2: number, y2: number, color: string = "black", lineWidth: number = 1) {
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }

        function fillRect(x: number, y: number, width: number, height: number, color: string = "black") {
            if (ctx) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, width, height);
            }
        }

        function fillCircle(x: number, y: number, radius: number, color: string = "black") {
            if (ctx) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function drawRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: string = "black") {
            if (ctx) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.stroke();
            }
        }

        function fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: string = "black") {
            if (ctx) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.fill();
            }
        }

        function fillCanvas(color: string = "white") {
            if (ctx) {
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, width, height);
            }
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

function createElementForFlavor(flavor: Flavor, from: number, to: number): FlavorElement {
    const d: FlavorElement = {
        from: from,
        to: to,
        flavor: {
            colors: FLAVOR_COLOR[flavor],
            imageObj: loadImage(FLAVOR_IMAGES[flavor]),
            image: FLAVOR_IMAGES[flavor],
            name: flavor,
            contrastColor: contrastColor(darkenIfBright(FLAVOR_COLOR[flavor][0])),
            bgColor: darkenIfBright(FLAVOR_COLOR[flavor][0])
        }
    }
    return d;
}

function loadImage(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img
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
    imageObj: HTMLImageElement;
    colors: string[];
    contrastColor: string;
    bgColor: string;
}

function contrastColor(hex: string): string {
    // Remove leading '#'
    hex = hex.replace("#", "");

    // Support shorthand #RGB
    if (hex.length === 3) {
        hex = hex.split("").map(ch => ch + ch).join("");
    }

    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const srgb = [r, g, b].map((c) => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    // Relative luminance
    const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];

    // If luminance is high, use dark text; otherwise light text
    return luminance > 0.179 ? "#000000" : "#FFFFFF";
}


function darkenIfBright(hex: string, amount: number = 0.6): string {
    hex = hex.replace("#", "");

    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // brightness formula (0 - 255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness <= 125) {
        return `#${hex}`;
    }

    const darken = (v: number) => Math.max(0, Math.round(v * (1 - amount)));

    const newR = darken(r);
    const newG = darken(g);
    const newB = darken(b);

    const toHex = (v: number) => v.toString(16).padStart(2, "0");

    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

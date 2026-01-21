import { useEffect, useRef, useState } from "react"
import { useSynthLines } from "../../contexts/SynthLinesContext";
import type { CurrentSpan, FlavorSynthLine } from "./FlavorSynth";
import { FLAVOR_COLOR, FLAVOR_IMAGES, type Flavor } from "../../@types/Flavors";
import { calculateCurrentPosSeconds, convertTimelineXToScreen, createElementForFlavor, drawElement, getOffsetX, getPixelsPerSecond, LINE_MARKER_HEIGHT, LINE_Y, MARGIN_BETWEEN_SCALE_AND_FLAVORS, STROKES_COLORS, TOTAL_SYNTH_HEIGHT, UNIT } from "../FlavorUtils";
import { useTooltip } from "./TooltipContext";
import { useSynthSelector } from "./SynthSelectorContext";


export default function PlayerTrack({ width, currentScrolledRef, flavorSynthLine }: { width: number, currentScrolledRef: React.RefObject<CurrentSpan>, flavorSynthLine: FlavorSynthLine }) {
    const synthLines = useSynthLines();
    const tooltip = useTooltip();
    const synthSelector = useSynthSelector();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePosRef = useRef<{ x: number; y: number; }>({ x: -1, y: -1 });
    const currentDraggingElementRef = useRef<null | FlavorElement>(null);
    const tooSmallToDisplayUUIDs = useRef<string[]>([]);
    const selectedElementRef = useRef<null | FlavorElement>(null);

    const repaint = () => {
        requestAnimationFrame(render);
    };

    synthSelector.addSynthSelectionChange(() => {
        repaint();
    });


    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        let isMouseDown = false;

        const onMouseMoveUpdate = (e: MouseEvent) => {
            const span = currentScrolledRef.current;
            if (!span) return;
            const mouse = mousePosRef.current;


            let foundOneWhereMouseOver = false;
            for (const element of flavorSynthLine.elements) {
                const fromPos = element.from * getPixelsPerSecond();
                const toPos = element.to * getPixelsPerSecond();

                const isAbove = updateCursorForElement();
                foundOneWhereMouseOver = foundOneWhereMouseOver || isAbove;

                function updateCursorForElement() {
                    if (!(mouse.x >= convertTimelineXToScreen(fromPos) && mouse.x <= convertTimelineXToScreen(toPos))) return false;
                    const TOLERANCE = 5;
                    if (mouse.x >= convertTimelineXToScreen(fromPos) && mouse.x <= convertTimelineXToScreen(fromPos) + TOLERANCE) {
                        canvas.style.cursor = "ew-resize";
                    } else if (mouse.x >= convertTimelineXToScreen(toPos) - TOLERANCE && mouse.x <= convertTimelineXToScreen(toPos)) {
                        canvas.style.cursor = "ew-resize";
                    } else {
                        canvas.style.cursor = "move";
                    }
                    return true;
                }

                if (isAbove) {
                    if (tooltip.current && tooSmallToDisplayUUIDs.current.indexOf(element.uuid) != -1) {
                        const xOfElement = element.from * getPixelsPerSecond() - getOffsetX();
                        const yOfElement = LINE_Y + MARGIN_BETWEEN_SCALE_AND_FLAVORS;

                        const width = (element.to - element.from) * getPixelsPerSecond();

                        tooltip.current.textContent = element.flavor.name;
                        tooltip.current.style.left = (xOfElement + width / 2) + "px";
                        // tooltip.current.style.setProperty("--offset-y",)
                        tooltip.current.style.display = "block";
                    }
                }

            }
            if (!foundOneWhereMouseOver) {
                canvas.style.cursor = "default";
                if (tooltip.current) tooltip.current.style.display = "none";
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

            const mouse = mousePosRef.current;


            let foundOneWhereMouseOver = false;
            for (const element of flavorSynthLine.elements) {
                const fromPos = element.from * getPixelsPerSecond();
                const toPos = element.to * getPixelsPerSecond();


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
            repaint();
        };

        const onDrag = (e: MouseEvent) => {
            if (!currentlyResizing) return;
            if (action == "move" && startPosition == -1) return;
            const span = currentScrolledRef.current;
            if (!span) return;
            const mouse = mousePosRef.current;

            const currentPos = calculateCurrentPosSeconds(mouse.x);

            switch (action) {
                case "move":
                    const delta = (currentPos - moveStartOffsetToEnd) - startPositionOfElement;
                    const size = currentlyResizing.to - currentlyResizing.from;
                    const fromNew = startPositionOfElement + delta;
                    if (!isEmpty(currentlyResizing, startPositionOfElement + delta, fromNew + size)) return;
                    currentlyResizing.from = startPositionOfElement + delta;
                    currentlyResizing.to = fromNew + size;
                    break;
                case "resizeL":
                    if (currentPos >= currentlyResizing.to) {
                        if (!isEmpty(currentlyResizing, currentPos + 1)) return;
                        currentlyResizing.to = currentPos + 1;
                    }
                    if (!isEmpty(currentlyResizing, currentPos, currentlyResizing.to)) return;
                    currentlyResizing.from = currentPos;
                    break;
                case "resizeR":
                    if (currentPos <= currentlyResizing.from) {
                        if (!isEmpty(currentlyResizing, currentPos - 1)) return;
                        currentlyResizing.from = currentPos - 1;
                    }
                    if (!isEmpty(currentlyResizing, currentlyResizing.from, currentPos)) return;
                    currentlyResizing.to = currentPos;
                    break;
            }
            repaint();

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

        const onClick = (e: MouseEvent) => {
            synthSelector.setSelectedSynthLine(flavorSynthLine.uuid);
            const currentSecondClicked = calculateCurrentPosSeconds(e.x);
            let foundElement = null;
            for (const element of flavorSynthLine.elements) {
                if (currentSecondClicked >= element.from && currentSecondClicked <= element.to) {
                    foundElement = element;
                    break;
                }
            }
            selectedElementRef.current = foundElement;
            repaint();
        };

        const onKeyPress = (e: KeyboardEvent) => {
            if (synthSelector.focusedSynthRef.current != flavorSynthLine.uuid) return;
            switch (e.key) {
                case "Delete":
                    if (selectedElementRef.current) {
                        const idx = flavorSynthLine.elements.findIndex(el => el.uuid == selectedElementRef.current?.uuid);
                        if (idx != -1) {
                            flavorSynthLine.elements.splice(idx, 1);
                        }
                    }
                    selectedElementRef.current = null;
                    break;
                case "Escape":
                    selectedElementRef.current = null;
                    break;
            }
            console.log("Key pressed:", e.key);
            repaint();
        };

        const onWheel = (e: WheelEvent) => {
            synthLines.onWheel(e);
            repaint();
        };

        const wheelArgs = {
            passive: true,
            capture: true
        };

        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp, wheelArgs);
        canvas.addEventListener("wheel", onWheel);
        canvas.addEventListener("click", onClick);
        window.addEventListener("keydown", onKeyPress);
        repaint();

        return () => {
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("wheel", onWheel, wheelArgs);
            canvas.removeEventListener("click", onClick);
            window.removeEventListener("keydown", onKeyPress);
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

        ctx.strokeStyle = STROKES_COLORS;
        ctx.lineWidth = 1;
        // ctx.beginPath();
        // ctx.moveTo(0, LINE_Y);
        // ctx.lineTo(width, LINE_Y);
        // ctx.closePath();
        // ctx.stroke();

        for (let i = Math.floor(span.from); i <= span.to; i++) {
            const x = i * pixelsPerSecond - getOffsetX();
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

        for (const element of [...flavorSynthLine.elements, currentDraggingElementRef.current].filter(e => e != null).filter(e => e.from < span.to && e.to > span.from)) {
            const isSelected = selectedElementRef.current?.uuid == element!.uuid && synthSelector.focusedSynthRef.current == flavorSynthLine.uuid;
            const drewTitle = drawElement(element, ctx, getOffsetX(), LINE_Y + MARGIN_BETWEEN_SCALE_AND_FLAVORS + LINE_MARKER_HEIGHT, isSelected);
            if (!drewTitle) {
                if (tooSmallToDisplayUUIDs.current.indexOf(element.uuid) == -1) {
                    tooSmallToDisplayUUIDs.current.push(element.uuid);
                }
            } else {
                const idx = tooSmallToDisplayUUIDs.current.indexOf(element.uuid);
                if (idx != -1) {
                    tooSmallToDisplayUUIDs.current.splice(idx, 1);
                }
            }
        }

        function clearCanvas() {
            if (ctx) {
                ctx.clearRect(0, 0, width, TOTAL_SYNTH_HEIGHT);
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
                ctx.fillRect(0, 0, width, TOTAL_SYNTH_HEIGHT);
            }
        }


    };


    // useEffect(() => {
    //     let running = true;

    //     const loop = () => {
    //         if (!running) return;
    //         render();
    //         requestAnimationFrame(loop);
    //     };

    //     requestAnimationFrame(loop);

    //     return () => {
    //         running = false;
    //     };
    // }, [width]);

    function isEmpty(element: FlavorElement | null, from: number, to?: number): boolean {
        if (from < 0) return false;
        const toCheck = flavorSynthLine.elements.filter(e => e !== element);
        for (const element of toCheck) {
            if (to == undefined) {
                // For resizing
                if (from > element.from && from < element.to) return false;
            } else {
                if (from > element.from && from < element.to || to > element.from && to < element.to) return false;
                if (element.from > from && element.from < to || element.to > from && element.to < to) return false;
                if (element.from == from && element.to == to) return false;
            }
        }
        return true;
    }


    const onDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const offsetImageRaw = e.dataTransfer.getData("text/offsetImage");
        const elementLengthRaw = e.dataTransfer.getData("text/elementLength");
        const flavorNameRaw = e.dataTransfer.getData("text/plain");


        if (!offsetImageRaw || !elementLengthRaw) {
            return;
        }
        const offsetImage = JSON.parse(offsetImageRaw);
        const elementLength = parseInt(elementLengthRaw, 10);
        const flavorName = flavorNameRaw as Flavor;
        const x = e.clientX;
        const y = e.clientY;

        const currentPos = calculateCurrentPosSeconds(x - offsetImage.offsetX);

        if (isEmpty(null, currentPos, currentPos + elementLength) == false) {
            let startPos = -1;
            let endPos = -1;
            for (let start = 0; start <= elementLength; start++) {
                if (isEmpty(null, currentPos + start)) {
                    console.log("Found possible position at:", currentPos + start);
                    startPos = startPos == -1 ? currentPos + start : Math.min(startPos, currentPos + start);
                    endPos = Math.max(endPos, currentPos + start);
                } else {
                    if (startPos != -1) break;
                }
            }

            console.log("Suggested position at:", startPos, endPos);

            if (startPos != -1 && endPos != -1) {
                flavorSynthLine.elements.push(createElementForFlavor(flavorName, startPos, endPos));
                console.log("Dropped at seconds:", startPos, flavorSynthLine.elements);
                synthLines.setSynthLines([...synthLines.synthLines]);
            }
            currentDraggingElementRef.current = null;
            repaint();
            return;
        }

        flavorSynthLine.elements.push(createElementForFlavor(flavorName, currentPos, currentPos + elementLength));
        console.log("Dropped at seconds:", currentPos, flavorSynthLine.elements);
        synthLines.setSynthLines([...synthLines.synthLines]);
        currentDraggingElementRef.current = null;
        repaint();
    };

    const onDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
        try {
            const offsetImageRaw = e.dataTransfer.getData("text/offsetImage");
            const elementLengthRaw = e.dataTransfer.getData("text/elementLength");
            const flavorNameRaw = e.dataTransfer.getData("text/plain");


            if (!offsetImageRaw || !elementLengthRaw) {
                currentDraggingElementRef.current = null;
                return;
            }
            const offsetImage = JSON.parse(offsetImageRaw);
            const elementLength = parseInt(elementLengthRaw, 10);
            const flavorName = flavorNameRaw as Flavor;
            const x = e.clientX;
            const y = e.clientY;

            const currentPos = calculateCurrentPosSeconds(x - offsetImage.offsetX);

            if (isEmpty(null, currentPos, currentPos + elementLength) == false) {
                let startPos = -1;
                let endPos = -1;
                for (let start = 0; start <= elementLength; start++) {
                    if (isEmpty(null, currentPos + start)) {
                        console.log("Found possible position at:", currentPos + start);
                        startPos = startPos == -1 ? currentPos + start : Math.min(startPos, currentPos + start);
                        endPos = Math.max(endPos, currentPos + start);
                    } else {
                        if (startPos != -1) break;
                    }
                }

                console.log("Suggested position at:", startPos, endPos);

                if (startPos != -1 && endPos != -1) {
                    currentDraggingElementRef.current = createElementForFlavor(flavorName, startPos, endPos);
                    console.log("Dragging over at seconds (adjusted):", startPos);
                    e.preventDefault();
                    repaint();
                    return;
                }

                currentDraggingElementRef.current = null;
                return;
            }

            currentDraggingElementRef.current = createElementForFlavor(flavorName, currentPos, currentPos + elementLength);

            e.dataTransfer.setDragImage(new Image(), 0, 0);
            console.log("Dragging over at seconds:", currentPos);
            e.preventDefault();
            repaint();
        } catch (ex) {
            currentDraggingElementRef.current = null;
            repaint();
        }
    };

    const onDragLeave = () => {
        currentDraggingElementRef.current = null;
        repaint();
    };

    const onLeave = () => {
        tooltip.current!.style.display = "none";
        currentDraggingElementRef.current = null;
        repaint();
    };

    return <canvas onMouseLeave={onLeave} onDragExit={onDragLeave} onDrop={onDrop} onDragOver={onDragOver} style={{ touchAction: "none" }} width={width} height={TOTAL_SYNTH_HEIGHT} ref={canvasRef}></canvas>
}


export type FlavorElement = {
    from: number;
    to: number;
    uuid: string;
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

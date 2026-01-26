import { useEffect, useRef } from "react"
import { useSynthLines } from "../../contexts/SynthLinesContext";
import type { CurrentSpan, FlavorSynthLine } from "./FlavorSynth";
import { type Flavor } from "../../@types/Flavors";
import { calculateCurrentPosSeconds, calculateCurrentPosSecondsAccurate, calculateSecondsToCurrentPos, convertScreenXToTimeline, convertTimelineXToScreen, createElementForFlavor, drawElement, FLAVOR_HEIGHT, getOffsetX, getPixelsPerSecond, LINE_MARKER_HEIGHT, LINE_Y, MARGIN_BETWEEN_SCALE_AND_FLAVORS, MARKER_EXTRA_SIZE, STROKES_COLORS, TOTAL_SYNTH_HEIGHT, UNIT } from "../FlavorUtils";
import { loadAndSaveResource } from "../ResourceSaver";
import { useTooltip } from "../../contexts/TooltipContext";
import { useSynthSelector } from "../../contexts/SynthSelectorContext";
import { useInterPlayerDrag } from "../../contexts/CurrentInterPlayerDragContext";
import { useCurrentlyPlaying } from "../../contexts/CurrentlyPlayingContext";

var currentPosAnimationImages = (window as any).CURRENT_ANIMATIONS_IMAGES;
var imageCount = 99;
var ROOT_PATH = "./blender/outputs/CurrentPositionPlayer/";
var currentAnimationPosition = 0;

if (!currentPosAnimationImages) {
    currentPosAnimationImages = [];

    (async () => {
        const batchSize = 5;
        for (let i = 0; i < imageCount; i += batchSize) {
            const batch = Array.from({ length: batchSize }, (_, j) => i + j).filter(x => x < imageCount);
            await Promise.all(batch.map(async (idx) => {
                const img = new Image();
                img.src = await loadAndSaveResource("currentCursorPositionAnimation", "image_" + i, ROOT_PATH + i.toString().padStart(4, "0") + ".png");
                await new Promise(res => img.onload = res);
                currentPosAnimationImages[idx] = img;
            }));
        }
        console.log("Loaded all");

    })();

    setInterval(() => {
        currentAnimationPosition++;
        currentAnimationPosition = currentAnimationPosition % 100;
    }, 20);

    (window as any).CURRENT_ANIMATIONS_IMAGES = currentPosAnimationImages;
}

export default function PlayerTrack({ widthRef, currentScrolledRef, flavorSynthLine }: { widthRef: React.RefObject<number>, currentScrolledRef: React.RefObject<CurrentSpan>, flavorSynthLine: FlavorSynthLine }) {
    const synthLines = useSynthLines();
    const tooltip = useTooltip();
    const synthSelector = useSynthSelector();
    const currentPlaying = useCurrentlyPlaying();
    const interPlayerDrag = useInterPlayerDrag();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePosRef = useRef<{ x: number; y: number; }>({ x: -1, y: -1 });
    const currentDraggingElementRef = useRef<null | FlavorElement>(null);
    const tooSmallToDisplayUUIDs = useRef<string[]>([]);



    const timelineOffCanvasRef = useRef<OffscreenCanvas>(new OffscreenCanvas(widthRef.current, LINE_Y + LINE_MARKER_HEIGHT + MARKER_EXTRA_SIZE));
    const allElementsOffCanvasRef = useRef<OffscreenCanvas>(new OffscreenCanvas(widthRef.current, FLAVOR_HEIGHT));
    const currentPositionCursorCanvasRef = useRef<OffscreenCanvas>(new OffscreenCanvas(widthRef.current, TOTAL_SYNTH_HEIGHT));

    const renderTimeline = () => {
        const ctx = timelineOffCanvasRef.current.getContext("2d");
        if (!ctx) return;
        const span = currentScrolledRef.current;
        clearCanvas(ctx, timelineOffCanvasRef.current);

        ctx.strokeStyle = STROKES_COLORS;
        ctx.lineWidth = 1;

        for (let i = Math.floor(span.from); i <= span.to; i++) {
            const x = i * getPixelsPerSecond() - getOffsetX();
            const time = Math.floor(i);
            ctx.beginPath();
            const extrSize = time % 10 == 0 ? MARKER_EXTRA_SIZE : 0;
            ctx.moveTo(x, LINE_Y - LINE_MARKER_HEIGHT / 2 - extrSize / 2);
            ctx.lineTo(x, LINE_Y + LINE_MARKER_HEIGHT / 2 + extrSize / 2);
            ctx.closePath();
            ctx.stroke();

            if (time % 10 == 0) {
                ctx.fillStyle = "white";
                ctx.font = "20px PixelFont";
                ctx.textAlign = "center";
                ctx.fillText(time + UNIT, x, LINE_Y / 2);
            }

            if (time % 5 == 0 && time % 10 != 0) {
                ctx.fillStyle = "rgb(125, 125, 125)";
                ctx.font = "17px PixelFont";
                ctx.textAlign = "center";
                ctx.fillText(time + UNIT, x, LINE_Y / 2);
            }

        }

        const currentPositionX = calculateSecondsToCurrentPos(currentPlaying.cusorPos.current);

        ctx.strokeStyle = "rgb(100, 100, 100)";
        ctx.beginPath();
        ctx.moveTo(currentPositionX, 0);
        ctx.lineTo(currentPositionX, LINE_Y + LINE_MARKER_HEIGHT + MARKER_EXTRA_SIZE);
        ctx.closePath();
        ctx.stroke();

    };
    renderTimeline();

    const renderElements = () => {//LINE_Y + MARGIN_BETWEEN_SCALE_AND_FLAVORS + LINE_MARKER_HEIGHT
        const ctx = allElementsOffCanvasRef.current.getContext("2d");
        if (!ctx) return;
        const span = currentScrolledRef.current;
        clearCanvas(ctx, allElementsOffCanvasRef.current);

        for (const element of [...flavorSynthLine.elements, currentDraggingElementRef.current]) {
            if (element == null) continue;
            if (element.uuid === interPlayerDrag.ref.current?.uuid && element.uuid !== currentDraggingElementRef.current?.uuid) continue;
            if (element.from >= span.to && element.to <= span.from) continue;

            const isSelected = synthSelector.selectedElementsRef.current.findIndex(el => el.uuid == element.uuid) != -1;
            const drewTitle = drawElement(element, ctx, getOffsetX(), 0, isSelected);
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

    };
    renderElements();

    const renderCurrentPositionCursor = () => {
        const ctx = currentPositionCursorCanvasRef.current.getContext("2d");
        if (!ctx) return;
        const span = currentScrolledRef.current;
        clearCanvas(ctx, currentPositionCursorCanvasRef.current);

        const currentSecondPlaying = currentPlaying.currentPositionRef.current;
        const xOfPlayhead = currentSecondPlaying * getPixelsPerSecond() - getOffsetX();

        // Draw playhead
        if ((currentPlaying.isPlayingRef.current || (currentPlaying.isPlayingRef.current && (flavorSynthLine.solo && currentPlaying.isSoloPlay.current))) && !flavorSynthLine.muted) {
            drawCurrentPos(xOfPlayhead, 0, xOfPlayhead, TOTAL_SYNTH_HEIGHT);
            // drawLine(, "red", 2);
        }

        function drawCurrentPos(x: number, y: number, xEnd: number, yEnd: number) {
            if (currentPosAnimationImages[currentAnimationPosition]) ctx?.drawImage(currentPosAnimationImages[currentAnimationPosition], x - 20, y, 40, yEnd);
        }
    }
    renderCurrentPositionCursor();


    let elementsDebounce = false;
    const renderElementsWDebounce = () => {
        if (!elementsDebounce) {
            elementsDebounce = true;
            requestAnimationFrame(() => {
                elementsDebounce = false;
                renderElements();
            })
        }
    }

    let timelineDebounce = false;
    const renderTimelineWDebounce = () => {
        if (!timelineDebounce) {
            timelineDebounce = true;
            requestAnimationFrame(() => {
                timelineDebounce = false;
                renderTimeline();
            })
        }
    }

    let currentPositionCursor = false;
    const renderCurrentPositionCursorWDebounce = () => {
        if (!currentPositionCursor) {
            currentPositionCursor = true;
            requestAnimationFrame(() => {
                currentPositionCursor = false;
                renderCurrentPositionCursor();
            })
        }
    }

    // const selectedElementsRef = useRef<FlavorElement[]>([]);

    synthSelector.addSynthSelectionChange(flavorSynthLine.uuid, () => {
        renderTimeline();
        renderElements();
    });


    synthLines.addSynthRepainter(flavorSynthLine.uuid, () => {
        render();
    });

    synthLines.addCurrentPositionRepainter(flavorSynthLine.uuid, renderCurrentPositionCursorWDebounce);
    synthLines.addElementsRepainter(flavorSynthLine.uuid, renderElementsWDebounce);
    synthLines.addTimelineRepainter(flavorSynthLine.uuid, renderTimelineWDebounce);


    synthLines.addCollisionCheckerCallback(flavorSynthLine.uuid, (fromOffset: number, toOffset: number) => {
        let canMove = true;
        synthSelector.selectedElementsRef.current?.forEach(el => {
            if (!canMove) return;
            const element = flavorSynthLine.elements.find(e => e.uuid == el.uuid);
            if (element) {
                let newFrom = element.from + fromOffset;
                let newTo = element.to + toOffset;

                if (fromOffset == 0) {
                    console.log(newFrom, newTo);
                    if (newTo <= newFrom) {
                        newTo = newFrom;
                        newFrom = newTo - 1;
                    }
                    if (newFrom < 0) newFrom = 0;

                } else if (toOffset == 0) {
                    if (newTo <= newFrom + 1) newTo = newFrom + 1;
                    if (newFrom < 0) newFrom = 0;

                } else {

                    canMove = canMove && isEmpty(element, newFrom, newTo);
                }
                canMove = canMove && isEmpty(element, newFrom, newTo);

            }
        });
        return canMove;
    });

    synthLines.addOnElementMove(flavorSynthLine.uuid, (secondsOffset: number) => {
        synthSelector.selectedElementsRef.current?.forEach(el => {
            const element = flavorSynthLine.elements.find(e => e.uuid == el.uuid);
            if (element) {
                element.from += secondsOffset;
                element.to += secondsOffset;
            }
        });
        // repaint();
    });

    synthLines.addOnElementResize(flavorSynthLine.uuid, (fromOffset: number, toOffset: number) => {
        const MIN_WIDTH = 1;

        synthSelector.selectedElementsRef.current?.forEach(el => {
            const element = flavorSynthLine.elements.find(e => e.uuid === el.uuid);
            if (!element) return;

            if (fromOffset !== 0 && toOffset === 0) {
                const newFrom = element.from + fromOffset;
                const newTo = element.to;

                if (newTo - newFrom < MIN_WIDTH) {
                    element.from = newFrom;
                    element.to = newFrom + MIN_WIDTH;
                } else {
                    element.from = newFrom;
                }
            }

            else if (toOffset !== 0 && fromOffset === 0) {
                const newFrom = element.from;
                const newTo = element.to + toOffset;

                if (newTo - newFrom < MIN_WIDTH) {
                    element.to = newTo;
                    element.from = newTo - MIN_WIDTH;
                } else {
                    element.to = newTo;
                }
            }

            if (element.from < 0) {
                const diff = -element.from;
                element.from = 0;
                element.to += diff;
            }
        });

        // repaint();
    });



    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        let isMouseDown = false;

        let didDrag = false;


        synthLines.addStopDraggingCallback(flavorSynthLine.uuid, () => {
            currentDraggingElementRef.current = null;
            targetElement = null;
            isMouseDown = false;
            renderElements();
        });

        const onTimelineDrag = (e: MouseEvent) => {
            const box = canvasRef.current?.getBoundingClientRect();
            const x = e.x - (box?.left ?? 0);

            const seconds = calculateCurrentPosSecondsAccurate(x);

            currentPlaying.cusorPos.current = seconds;
            synthLines.repaintAllTimelines();
        };

        const onMouseMoveUpdate = (e: MouseEvent) => {
            const span = currentScrolledRef.current;
            if (!span) return;
            const mouse = mousePosRef.current;

            if (mouse.y < timelineOffCanvasRef.current.height) {
                canvas.style.cursor = "default";
                return;
            }


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

        let targetElement: null | FlavorElement = null;
        let action: "move" | "resizeL" | "resizeR" = "move";
        let startPosition = -1;
        let startPositionOfElement = -1;
        let moveStartOffsetToEnd = -1;

        const onDragStart = (e: MouseEvent) => {
            const span = currentScrolledRef.current;
            if (!span) return;

            const mouse = mousePosRef.current;
            if (mouse.y < timelineOffCanvasRef.current.height) return;


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
                        targetElement = element;
                        startPositionOfElement = element.from;
                        moveStartOffsetToEnd = calculateCurrentPosSeconds(mouse.x) - element.from;
                        lastPos = calculateCurrentPosSeconds(mouse.x);
                    } else if (mouse.x >= convertTimelineXToScreen(toPos) - TOLERANCE && mouse.x <= convertTimelineXToScreen(toPos)) {
                        action = "resizeR";
                        targetElement = element;
                        startPositionOfElement = element.from;
                        moveStartOffsetToEnd = calculateCurrentPosSeconds(mouse.x) - element.from;
                        lastPos = calculateCurrentPosSeconds(mouse.x);
                    } else {
                        action = "move";
                        targetElement = element;
                        startPosition = mouse.x;
                        startPositionOfElement = element.from;
                        moveStartOffsetToEnd = calculateCurrentPosSeconds(mouse.x) - element.from;
                        lastPos = calculateCurrentPosSeconds(mouse.x);
                    }
                    return true;
                }

            }
            if (!foundOneWhereMouseOver) {
                canvas.style.cursor = "default";
            }
            // repaint();
        };

        let lastPos = -1;

        const onDrag = (e: MouseEvent) => {
            if (!targetElement) return;
            if (action == "move" && startPosition == -1) return;
            const span = currentScrolledRef.current;
            if (!span) return;
            const mouse = mousePosRef.current;
            if (mouse.y < timelineOffCanvasRef.current.height) return;
            didDrag = true;

            const currentPos = calculateCurrentPosSeconds(mouse.x);
            const selectedCount = synthSelector.selectedElementsRef.current.length;

            if (selectedCount <= 1) {
                switch (action) {
                    case "move":
                        const delta = (currentPos - moveStartOffsetToEnd) - startPositionOfElement;
                        const size = targetElement.to - targetElement.from;
                        const fromNew = startPositionOfElement + delta;
                        if (!isEmpty(targetElement, startPositionOfElement + delta, fromNew + size)) return;
                        targetElement.from = startPositionOfElement + delta;
                        targetElement.to = fromNew + size;
                        break;
                    case "resizeL":
                        if (currentPos >= targetElement.to) {
                            if (!isEmpty(targetElement, currentPos + 1)) return;
                            targetElement.to = currentPos + 1;
                        }
                        if (!isEmpty(targetElement, currentPos, targetElement.to)) return;
                        targetElement.from = currentPos;
                        break;
                    case "resizeR":
                        if (currentPos <= targetElement.from) {
                            if (!isEmpty(targetElement, currentPos - 1)) return;
                            targetElement.from = currentPos - 1;
                        }
                        if (!isEmpty(targetElement, targetElement.from, currentPos)) return;
                        targetElement.to = currentPos;
                        break;
                }
                // repaint();
            } else {
                switch (action) {
                    case "move":
                        {
                            console.log(currentPos, lastPos);
                            const delta = currentPos - lastPos;
                            lastPos = currentPos;
                            if (delta == 0) return;
                            if (synthLines.canOffsetAll(delta, delta)) {
                                console.log("Moving all by", delta, flavorSynthLine.uuid);
                                synthLines.moveAll(delta);
                            }
                            break;
                        }
                    case "resizeL":
                        {
                            const delta = currentPos - lastPos;
                            lastPos = currentPos;
                            if (delta == 0) return;
                            if (synthLines.canOffsetAll(delta, 0)) {
                                synthLines.resizeAll(delta, 0);
                            }
                            break;
                        }
                    case "resizeR":
                        {
                            const delta = currentPos - lastPos;
                            lastPos = currentPos;
                            if (delta == 0) return;
                            if (synthLines.canOffsetAll(0, delta)) {
                                synthLines.resizeAll(0, delta);
                            }
                            break;
                        }
                }
            }
            renderElements();
        };

        const onMouseMove = (e: MouseEvent) => {
            const box = canvasRef.current?.getBoundingClientRect();
            const x = e.clientX - (box?.left ?? 0);
            const y = e.clientY - (box?.top ?? 0);
            mousePosRef.current = {
                x: x,
                y: y
            };
            if (y < timelineOffCanvasRef.current.height && isMouseDown && targetElement == null && currentDraggingElementRef.current == null && interPlayerDrag.ref.current == null && !currentPlaying.isPlayingRef.current) {
                console.log(isMouseDown);
                onTimelineDrag(e);
                return;
            }
            if (isMouseDown) {
                onDrag(e);
            } else {
                onMouseMoveUpdate(e);
            }
        }

        const onMouseDown = (e: MouseEvent) => {
            isMouseDown = true;
            const box = canvasRef.current?.getBoundingClientRect();
            const y = e.y - (box?.top ?? 0);
            if (y < timelineOffCanvasRef.current.height) return;
            onDragStart(e);
        };

        const onMouseUp = () => {
            isMouseDown = false;
            console.log("Mouse up!!");
        };

        const onRelease = (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (didDrag) {
                didDrag = false;
                return;
            }
            const box = canvasRef.current?.getBoundingClientRect();
            const x = e.clientX - (box?.left ?? 0);
            const y = e.clientY - (box?.top ?? 0);

            synthSelector.setSelectedSynthLine(flavorSynthLine.uuid);
            const currentSecondClicked = calculateCurrentPosSeconds(x);
            let foundElement = null;
            for (const element of flavorSynthLine.elements) {
                if (currentSecondClicked >= element.from && currentSecondClicked <= element.to) {
                    foundElement = element;
                    break;
                }
            }
            if (e.shiftKey || e.ctrlKey) {
                if (foundElement == null) return;
                if (synthSelector.selectedElementsRef.current == null) {
                    synthSelector.selectedElementsRef.current = [];
                }
                if (synthSelector.selectedElementsRef.current.findIndex(el => el.uuid == foundElement!.uuid) == -1) {
                    synthSelector.selectedElementsRef.current.push(foundElement!);
                }
                // synthLines.repaintAll();
            } else {
                if (foundElement == null) {
                    synthSelector.selectedElementsRef.current = [];
                    // synthLines.repaintAll();
                } else {
                    synthSelector.selectedElementsRef.current = [foundElement];
                    // synthLines.repaintAll();
                }
            }
            // repaint();
            renderElements();
            targetElement = null;
        };

        const onKeyPress = (e: KeyboardEvent) => {
            if (synthSelector.focusedSynthRef.current != flavorSynthLine.uuid) return;
            switch (e.key) {
                case "Delete":
                    // if (synthSelector.selectedElementsRef.current) {
                    //     const idx = flavorSynthLine.elements.findIndex(el => synthSelector.selectedElementsRef.current.findIndex(sel => sel.uuid == el.uuid) != -1);
                    //     if (idx != -1) {
                    //         flavorSynthLine.elements.splice(idx, 1);
                    //     }
                    // }
                    // synthSelector.selectedElementsRef.current = [];
                    synthLines.deleteSelectedElements();
                    // synthLines.repaintAll();
                    break;
                case "Escape":
                    synthSelector.selectedElementsRef.current = [];
                    // synthLines.repaintAll();
                    break;
            }
            console.log("Key pressed:", e.key);
            // repaint();
        };

        const onWheel = (e: WheelEvent) => {
            synthLines.onWheel(e);
            // repaint();
        };

        const onMouseLeave = (e: MouseEvent) => {
            if (!isMouseDown) return;
            if (targetElement != null) {
                interPlayerDrag.ref.current = targetElement;
                interPlayerDrag.offsetLeft.current = moveStartOffsetToEnd;
                interPlayerDrag.onPlaced.current = () => {
                    targetElement = null;
                    startPosition = -1;
                    startPositionOfElement = -1;
                    moveStartOffsetToEnd = -1;
                    interPlayerDrag.ref.current = null;
                    interPlayerDrag.offsetLeft.current = 0;
                    currentDraggingElementRef.current = null;
                    renderElements();
                    interPlayerDrag.onPlaced.current = () => 0;
                };
                interPlayerDrag.isEmptyRef.current = isEmpty;
            }
        };

        const onMouseEnter = (e: MouseEvent) => {
            if (targetElement != null && interPlayerDrag.ref.current && flavorSynthLine.elements.includes(interPlayerDrag.ref.current)) {
                interPlayerDrag.ref.current = null;
                interPlayerDrag.offsetLeft.current = 0;
            }
        };

        const onMouseMoveExternalElement = (e: MouseEvent) => {
            if (interPlayerDrag.ref.current != null) {
                const canvasBox = canvasRef.current?.getBoundingClientRect();
                if (!canvasBox) return;
                const x = e.clientX - canvasBox.left;
                const seconds = calculateCurrentPosSeconds(x);
                const offset = interPlayerDrag.offsetLeft.current ?? 0;
                const currentDragPos = seconds - offset;
                const element = interPlayerDrag.ref.current;

                const elementSpan = element.to - element.from;

                const newFrom = currentDragPos;
                const newTo = currentDragPos + elementSpan

                if (!isEmpty(element, newFrom, newTo)) {
                    synthLines.repaintAllElements();
                    return;
                }

                element.from = newFrom;
                element.to = newTo;
                currentDraggingElementRef.current = element;

                renderElements();
            }
        };

        const onReleaseExternalElement = (e: MouseEvent) => {
            if (interPlayerDrag.ref.current != null) {
                const canvasBox = canvasRef.current?.getBoundingClientRect();
                if (!canvasBox) return;
                const x = e.clientX - canvasBox.left;
                const seconds = calculateCurrentPosSeconds(x);
                const offset = interPlayerDrag.offsetLeft.current ?? 0;
                const currentDragPos = seconds - offset;
                const element = interPlayerDrag.ref.current;
                const elementSpan = element.to - element.from;

                const newFrom = currentDragPos;
                const newTo = currentDragPos + elementSpan

                if (!isEmpty(element, newFrom, newTo)) {
                    synthLines.repaintAllElements();
                    return;
                }

                console.log(flavorSynthLine);
                synthLines.deleteElement(element.uuid);

                element.from = newFrom;
                element.to = newTo;
                flavorSynthLine.elements.push(element);

                console.log(flavorSynthLine);

                interPlayerDrag.onPlaced.current();
                currentDraggingElementRef.current = null;
                // interPlayerDrag.ref.current = null;
                targetElement = null;
            }
        };

        const wheelArgs = {
            passive: true,
            capture: true
        };

        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseleave", onMouseLeave);
        canvas.addEventListener("mouseenter", onMouseEnter);
        canvas.addEventListener("mouseup", onReleaseExternalElement);
        canvas.addEventListener("mousemove", onMouseMoveExternalElement);
        canvas.addEventListener("wheel", onWheel);
        canvas.addEventListener("click", onRelease);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("keydown", onKeyPress);
        // repaint();

        return () => {
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("mouseleave", onMouseLeave);
            canvas.removeEventListener("mouseenter", onMouseEnter);
            canvas.removeEventListener("mouseup", onReleaseExternalElement);
            canvas.removeEventListener("mousemove", onMouseMoveExternalElement);
            canvas.removeEventListener("wheel", onWheel);
            canvas.removeEventListener("click", onRelease);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("keydown", onKeyPress);
        };

    }, [canvasRef.current]);

    const render = () => {
        const span = currentScrolledRef.current;
        if (!span) return;
        const secondsBetween = span.to - span.from;
        // const pixelsPerSecond = widthRef.current / secondsBetween;
        if (secondsBetween <= 0) return;
        const canvas = canvasRef.current!;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        clearCanvas(ctx, canvas);

        ctx.drawImage(timelineOffCanvasRef.current, 0, 0);
        ctx.drawImage(allElementsOffCanvasRef.current, 0, LINE_Y + MARGIN_BETWEEN_SCALE_AND_FLAVORS + LINE_MARKER_HEIGHT);
        ctx.drawImage(currentPositionCursorCanvasRef.current, 0, 0);
    };


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
        const box = canvasRef.current?.getBoundingClientRect();
        const x = e.clientX - (box?.left ?? 0);
        const y = e.clientY - (box?.top ?? 0);

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

            if (startPos != -1 && endPos != -1 && startPos != endPos) {
                flavorSynthLine.elements.push(createElementForFlavor(flavorName, startPos, endPos));
                console.log("Dropped at seconds:", startPos, flavorSynthLine.elements);
                synthLines.setSynthLines([...synthLines.synthLines]);
            }
            currentDraggingElementRef.current = null;
            // repaint();
            renderElementsWDebounce();
            return;
        }

        flavorSynthLine.elements.push(createElementForFlavor(flavorName, currentPos, currentPos + elementLength));
        console.log("Dropped at seconds:", currentPos, flavorSynthLine.elements);
        synthLines.setSynthLines([...synthLines.synthLines]);
        currentDraggingElementRef.current = null;
        // repaint();
        renderElementsWDebounce();
    };

    const onDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
        try {
            const offsetImageRaw = e.dataTransfer.getData("text/offsetImage");
            const elementLengthRaw = e.dataTransfer.getData("text/elementLength");
            const flavorNameRaw = e.dataTransfer.getData("text/plain");


            if (!offsetImageRaw || !elementLengthRaw) {
                currentDraggingElementRef.current = null;
                renderElementsWDebounce();
                return;
            }
            const offsetImage = JSON.parse(offsetImageRaw);
            const elementLength = parseInt(elementLengthRaw, 10);
            const flavorName = flavorNameRaw as Flavor;
            const box = canvasRef.current?.getBoundingClientRect();
            const x = e.clientX - (box?.left ?? 0);
            const y = e.clientY - (box?.top ?? 0);

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

                if (startPos != -1 && endPos != -1 && startPos != endPos) {
                    currentDraggingElementRef.current = createElementForFlavor(flavorName, startPos, endPos);
                    console.log("Dragging over at seconds (adjusted):", startPos);
                    e.preventDefault();
                    renderElementsWDebounce();
                    return;
                }

                currentDraggingElementRef.current = null;
                renderElementsWDebounce();
                return;
            }

            currentDraggingElementRef.current = createElementForFlavor(flavorName, currentPos, currentPos + elementLength);

            console.log("Dragging over at seconds:", currentPos);
            e.preventDefault();
        } catch (ex) {
            currentDraggingElementRef.current = null;
        }
        renderElementsWDebounce();
    };

    const onDragLeave = () => {
        currentDraggingElementRef.current = null;
        // repaint();
        renderElementsWDebounce();
    };

    const onLeave = () => {
        tooltip.current!.style.display = "none";
        currentDraggingElementRef.current = null;
        // repaint();
        renderElementsWDebounce();
    };

    return <canvas className="trackCanvas" onMouseLeave={onLeave} onDragExit={onDragLeave} onDrop={onDrop} onDragOver={onDragOver} style={{ touchAction: "none" }} width={widthRef.current} height={TOTAL_SYNTH_HEIGHT} ref={canvasRef}></canvas>
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
    renderBackgroundMask: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void;
}



function clearCanvas(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvas: HTMLCanvasElement | OffscreenCanvas) {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function drawRect(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string = "black") {
    if (ctx) {
        ctx.fillStyle = color;
        ctx.rect(x, y, width, height);
    }
}

function drawCircle(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, radius: number, color: string = "black") {
    if (ctx) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawLine(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string = "black", lineWidth: number = 1) {
    if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

function fillRect(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string = "black") {
    if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    }
}

function fillCircle(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, radius: number, color: string = "black") {
    if (ctx) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}


function fillCanvas(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvas: HTMLCanvasElement | OffscreenCanvas, color: string = "white") {
    if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}
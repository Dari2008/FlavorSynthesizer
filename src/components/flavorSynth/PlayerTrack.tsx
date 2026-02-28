import { useEffect, useRef } from "react"
import { useSynthLines } from "../../contexts/SynthLinesContext";
import { type Flavor } from "../../@types/Flavors";
import { calculateCurrentPosSeconds, calculateCurrentPosSecondsAccurate, calculateSecondsToCurrentPos, constrainSpan, convertPixelsToSeconds, convertTimelineXToScreen, createElementForFlavor, drawElement, FLAVOR_HEIGHT, getOffsetX, getPixelsPerSecond, getSpan, LINE_MARKER_HEIGHT, LINE_Y, MARGIN_BETWEEN_SCALE_AND_FLAVORS, MARKER_EXTRA_SIZE, MAX_SPAN, MIN_SPAN, setSpan, STROKES_COLORS, TOTAL_SYNTH_HEIGHT, UNIT } from "../FlavorUtils";
import { useTooltip } from "../../contexts/TooltipContext";
import { useSynthSelector } from "../../contexts/SynthSelectorContext";
import { useInterPlayerDrag } from "../../contexts/CurrentInterPlayerDragContext";
import { useCurrentlyPlaying } from "../../contexts/CurrentlyPlayingContext";
import { useCurrentDish } from "../../contexts/CurrentDish";
import { useSynthChange } from "../../contexts/SynthChangeContext";
import { ActionHistoryManager } from "./actionHistory/ActionHistoryManager";
import { useGameState } from "../../contexts/GameStateContext";
import { useTouchChecker } from "../../contexts/TouchCheckerContext";
import { useCurrentDraggingElement } from "../../contexts/CurrentDraggingElementTouch";
import Utils from "../../utils/Utils";
import { useFlavorSynthContextMenu } from "../../contexts/FlavorSynthContextMenuContext";

// var currentPosAnimationImages = ;
var currentAnimationPosition = 0;


type Pos = { x: number; y: number; };

setInterval(() => {
    currentAnimationPosition++;
    currentAnimationPosition = currentAnimationPosition % 100;
}, 20);

export default function PlayerTrack({ widthRef, synthLineUUID }: { widthRef: React.RefObject<number>, synthLineUUID: string }) {
    const synthLines = useSynthLines();
    const tooltip = useTooltip();
    const synthSelector = useSynthSelector();
    const currentPlaying = useCurrentlyPlaying();
    const interPlayerDrag = useInterPlayerDrag();
    const gameState = useGameState().gameState;
    const isReadonly = gameState == "createDish-create-viewonly";

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePosRef = useRef<{ x: number; y: number; }>({ x: -1, y: -1 });
    const currentDraggingElementRef = useRef<null | FlavorElement>(null);
    const tooSmallToDisplayUUIDs = useRef<string[]>([]);

    const change = useSynthChange();
    const isTouch = useTouchChecker().isTouch;
    const currentDragging = useCurrentDraggingElement();
    const touchContextMenu = useFlavorSynthContextMenu();

    const timelineOffCanvasRef = useRef<OffscreenCanvas>(new OffscreenCanvas(widthRef.current, LINE_Y + LINE_MARKER_HEIGHT + MARKER_EXTRA_SIZE));
    const allElementsOffCanvasRef = useRef<OffscreenCanvas>(new OffscreenCanvas(widthRef.current, FLAVOR_HEIGHT));
    const currentPositionCursorCanvasRef = useRef<OffscreenCanvas>(new OffscreenCanvas(widthRef.current, TOTAL_SYNTH_HEIGHT));


    const startDraggedPositionTouch = useRef<Pos>({ x: -1, y: -1 });
    const currentlyResizingElement = useRef<string | null>(null);
    const resizeSide = useRef<"from" | "to" | "move">("from");
    const startDraggedPositionSecondsTouch = useRef<Pos>({ x: -1, y: -1 });
    const startElementPos = useRef<number>(0);
    const startTime = useRef<number>(Date.now());
    const startedDragAtTimeline = useRef<boolean>(false);

    const currentDish = useCurrentDish();

    const flavorSynthLine = (currentDish?.data ?? []).filter(e => e.uuid == synthLineUUID).at(0) ?? {
        elements: [],
        muted: false,
        solo: false,
        uuid: crypto.randomUUID(),
        volume: 1
    };

    const render = () => {
        const span = getSpan();
        if (!span) return;
        const secondsBetween = span.to - span.from;
        // const pixelsPerSecond = widthRef.current / secondsBetween;


        if (secondsBetween <= 0) return;
        const canvas = canvasRef.current!;
        if (!canvas) return;

        if (widthRef.current != canvas.width) {
            canvas.width = widthRef.current;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        clearCanvas(ctx, canvas);

        ctx.drawImage(timelineOffCanvasRef.current, 0, 0);
        ctx.drawImage(allElementsOffCanvasRef.current, 0, LINE_Y + MARGIN_BETWEEN_SCALE_AND_FLAVORS + LINE_MARKER_HEIGHT);
        ctx.drawImage(currentPositionCursorCanvasRef.current, 0, 0);
    };

    let currentRender = false;
    const renderWithDebounce = () => {
        if (!currentRender) {
            currentRender = true;
            requestAnimationFrame(() => {
                render();
                currentRender = false;
            });
        }
    }

    const renderTimeline = () => {
        if (widthRef.current != timelineOffCanvasRef.current.width) {
            timelineOffCanvasRef.current.width = widthRef.current;
        }

        const ctx = timelineOffCanvasRef.current.getContext("2d");
        if (!ctx) return;
        const span = getSpan();
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
        renderWithDebounce();

    };

    const renderElements = () => {//LINE_Y + MARGIN_BETWEEN_SCALE_AND_FLAVORS + LINE_MARKER_HEIGHT
        if (widthRef.current != allElementsOffCanvasRef.current.width) {
            allElementsOffCanvasRef.current.width = widthRef.current;
        }

        const ctx = allElementsOffCanvasRef.current.getContext("2d");
        if (!ctx) return;
        const span = getSpan();
        clearCanvas(ctx, allElementsOffCanvasRef.current);
        for (const element of [...flavorSynthLine.elements, currentDraggingElementRef.current]) {
            if (element == null) continue;
            if (element.uuid === interPlayerDrag.ref.current?.uuid && element.uuid !== currentDraggingElementRef.current?.uuid) continue;
            if (element.from >= span.to && element.to <= span.from) continue;

            const isSelected = synthSelector.selectedElementsRef.current.findIndex(elUUID => elUUID == element.uuid) != -1;
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
        renderWithDebounce();

    };

    const renderCurrentPositionCursor = () => {
        if (widthRef.current != currentPositionCursorCanvasRef.current.width) {
            currentPositionCursorCanvasRef.current.width = widthRef.current;
        }

        const ctx = currentPositionCursorCanvasRef.current.getContext("2d");
        if (!ctx) return;
        clearCanvas(ctx, currentPositionCursorCanvasRef.current);

        const currentSecondPlaying = currentPlaying.currentPositionRef.current;
        const xOfPlayhead = currentSecondPlaying * getPixelsPerSecond() - getOffsetX();

        // Draw playhead
        if ((currentPlaying.isPlayingRef.current || (currentPlaying.isPlayingRef.current && (flavorSynthLine.solo && currentPlaying.isSoloPlay.current))) && !flavorSynthLine.muted) {
            drawCurrentPos(xOfPlayhead, 0, xOfPlayhead, TOTAL_SYNTH_HEIGHT);
            // drawLine(, "red", 2);
        }

        renderWithDebounce();

        function drawCurrentPos(x: number, y: number, _xEnd: number, yEnd: number) {
            if ((window as any).CURRENT_ANIMATIONS_IMAGES[currentAnimationPosition]) ctx?.drawImage((window as any).CURRENT_ANIMATIONS_IMAGES[currentAnimationPosition], x - 20, y, 40, yEnd);
        }
    }


    useEffect(() => {
        renderTimelineWDebounce();
        renderElementsWDebounce();
        renderWithDebounce();
    }, [canvasRef.current]);


    let elementsDebounce = false;
    const renderElementsWDebounce = () => {
        if (!elementsDebounce) {
            elementsDebounce = true;
            requestAnimationFrame(() => {
                renderElements();
                elementsDebounce = false;
            })
        }
    }

    let timelineDebounce = false;
    const renderTimelineWDebounce = () => {
        if (!timelineDebounce) {
            timelineDebounce = true;
            requestAnimationFrame(() => {
                renderTimeline();
                timelineDebounce = false;
            })
        }
    }

    let currentPositionCursor = false;
    const renderCurrentPositionCursorWDebounce = () => {
        if (!currentPositionCursor) {
            currentPositionCursor = true;
            requestAnimationFrame(() => {
                renderCurrentPositionCursor();
                currentPositionCursor = false;
            });
        }
    }

    // const selectedElementsRef = useRef<FlavorElement[]>([]);

    synthSelector.addSynthSelectionChange(flavorSynthLine.uuid, () => {
        renderTimelineWDebounce();
        renderElementsWDebounce();
    });


    // synthLines.addSynthRepainter(flavorSynthLine.uuid, () => {
    //     renderWithDebounce();
    // });

    synthLines.addCurrentPositionRepainter(flavorSynthLine.uuid, renderCurrentPositionCursorWDebounce);
    synthLines.addElementsRepainter(flavorSynthLine.uuid, renderElementsWDebounce);
    synthLines.addTimelineRepainter(flavorSynthLine.uuid, renderTimelineWDebounce);


    synthLines.addCollisionCheckerCallback(flavorSynthLine.uuid, (fromOffset: number, toOffset: number) => {
        let canMove = true;
        synthSelector.selectedElementsRef.current?.forEach(elUUID => {
            if (!canMove) return;
            const element = flavorSynthLine.elements.find(e => e.uuid == elUUID);
            if (element) {
                let newFrom = element.from + fromOffset;
                let newTo = element.to + toOffset;

                if (fromOffset == 0) {
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
        synthSelector.selectedElementsRef.current?.forEach(elUUID => {
            const element = flavorSynthLine.elements.find(e => e.uuid == elUUID);
            if (element) {
                element.from += secondsOffset;
                element.to += secondsOffset;
            }
        });
        // repaint();
    });

    synthLines.addOnElementResize(flavorSynthLine.uuid, (fromOffset: number, toOffset: number) => {
        const MIN_WIDTH = 1;

        synthSelector.selectedElementsRef.current?.forEach(elUUID => {
            const element = flavorSynthLine.elements.find(e => e.uuid === elUUID);
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

    const openTouchMenu = (position: Pos) => {
        touchContextMenu.openContextMenu(position);
    };


    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        let isMouseDown = false;

        let didDrag = false;


        synthLines.addStopDraggingCallback(flavorSynthLine.uuid, () => {
            currentDraggingElementRef.current = null;
            targetElement = null;
            isMouseDown = false;
            renderElementsWDebounce();
        });

        const onTimelineDrag = (xOrg: number, _yOrg: number) => {
            const box = canvasRef.current?.getBoundingClientRect();
            const x = xOrg - (box?.left ?? 0);

            const seconds = calculateCurrentPosSecondsAccurate(x);

            currentPlaying.cusorPos.current = seconds;
            synthLines.repaintAllTimelines();
        };

        const onMouseMoveUpdate = () => {
            const span = getSpan();
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
                        // const yOfElement = LINE_Y + MARGIN_BETWEEN_SCALE_AND_FLAVORS;

                        const width = (element.to - element.from) * getPixelsPerSecond();

                        tooltip.current.textContent = element.flavor;
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

            if (isReadonly) {
                canvas.style.cursor = "default";
            }

        };

        let targetElement: null | FlavorElement = null;
        let action: "move" | "resizeL" | "resizeR" = "move";
        let startPosition = -1;
        let startPositionOfElement = -1;
        let moveStartOffsetToEnd = -1;

        const onDragStart = () => {
            if (isReadonly) return;
            const span = getSpan();
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

            if (targetElement != null) {
                interPlayerDrag.originalStartPos.current = [targetElement.from, targetElement.to];
            }
            // repaint();
        };

        let lastPos = -1;

        let startPosses: {
            trackUUID: string;
            flavors: {
                from: number;
                to: number;
                uuid: string;
            }[];
        }[] | undefined = undefined;

        const onDrag = () => {
            if (isReadonly) return;
            if (!targetElement) return;
            if (action == "move" && startPosition == -1) return;
            const span = getSpan();
            if (!span) return;
            const mouse = mousePosRef.current;
            if (mouse.y < timelineOffCanvasRef.current.height) return;
            didDrag = true;
            if (startPosses == undefined) {
                startPosses = synthLines.synthLines.map(e => {
                    const flavors = e.elements.filter(e => synthSelector.selectedElementsRef.current.includes(e.uuid) || currentDraggingElementRef.current?.uuid == e.uuid || targetElement?.uuid == e.uuid);
                    if (flavors.length == 0) return undefined;
                    return {
                        flavors: flavors.map(e => ({
                            from: e.from,
                            to: e.to,
                            uuid: e.uuid
                        })),
                        trackUUID: e.uuid
                    };
                }).filter(e => !!e).flat();
            }

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
                            const delta = currentPos - lastPos;
                            lastPos = currentPos;
                            if (delta == 0) return;
                            if (synthLines.canOffsetAll(delta, delta)) {
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
            renderElementsWDebounce();
            change.changed();
        };

        const onMouseMove = (xOrg: number, yOrg: number) => {
            const box = canvasRef.current?.getBoundingClientRect();
            const x = xOrg - (box?.left ?? 0);
            const y = yOrg - (box?.top ?? 0);
            mousePosRef.current = {
                x: x,
                y: y
            };
            if (y < timelineOffCanvasRef.current.height && isMouseDown && targetElement == null && currentDraggingElementRef.current == null && interPlayerDrag.ref.current == null && !currentPlaying.isPlayingRef.current) {
                onTimelineDrag(xOrg, yOrg);
                return;
            }
            if (isMouseDown) {
                onDrag();
            } else {
                onMouseMoveUpdate();
            }
        }

        const onMouseDown = (_xOrg: number, yOrg: number) => {
            if (isReadonly) return;
            isMouseDown = true;
            const box = canvasRef.current?.getBoundingClientRect();
            const y = yOrg - (box?.top ?? 0);
            if (y < timelineOffCanvasRef.current.height) return;
            onDragStart();
        };

        const onMouseUpReset = () => {
            isMouseDown = false;
        };

        const onMouseUp = () => {
            if (isReadonly) return;

            if (!didDrag) return;
            let selectedFlavors = synthLines.synthLines.map(e => {
                const flavors = e.elements.filter(e => synthSelector.selectedElementsRef.current.includes(e.uuid) || currentDraggingElementRef.current?.uuid == e.uuid || targetElement?.uuid == e.uuid);
                if (flavors.length == 0) return undefined;
                return {
                    flavors: flavors,
                    trackUUID: e.uuid
                };
            }).filter(e => !!e).flat();

            if (startPosses !== undefined && startPosses[0] != undefined && selectedFlavors[0] != undefined) {
                const offset = selectedFlavors[0].flavors[0].from - startPosses[0].flavors[0].from;
                const keptSize = (startPosses[0].flavors[0].to - startPosses[0].flavors[0].from) == (selectedFlavors[0].flavors[0].to - selectedFlavors[0].flavors[0].from);
                if (keptSize && offset == 0) return;
                if (keptSize) {
                    ActionHistoryManager.didAction({
                        type: "move",
                        elements: selectedFlavors.map((track, iTracks) => ({
                            trackUUID: track.trackUUID,
                            flavors: track.flavors.map((flavor, iFlavor) => ({
                                flavor: flavor,
                                oldFrom: startPosses![iTracks].flavors[iFlavor].from,
                                oldTo: startPosses![iTracks].flavors[iFlavor].to,
                                newFrom: selectedFlavors[iTracks].flavors[iFlavor].from,
                                newTo: selectedFlavors[iTracks].flavors[iFlavor].to,
                            }))
                        }))
                    })
                } else {
                    ActionHistoryManager.didAction({
                        type: "resize",
                        axis: offset == 0 ? "right" : "left",
                        elements: (
                            offset == 0
                                ?
                                selectedFlavors.map((track, iTracks) => ({
                                    trackUUID: track.trackUUID,
                                    flavors: track.flavors.map((flavor, iFlavor) => ({
                                        flavor: flavor,
                                        oldPos: startPosses![iTracks].flavors[iFlavor].to,
                                        newPos: flavor.to
                                    }))
                                }))
                                :
                                selectedFlavors.map((track, iTracks) => ({
                                    trackUUID: track.trackUUID,
                                    flavors: track.flavors.map((flavor, iFlavor) => ({
                                        flavor: flavor,
                                        oldPos: startPosses![iTracks].flavors[iFlavor].from,
                                        newPos: flavor.from
                                    }))
                                }))
                        )
                    });
                }
                startPosses = undefined;
            }
        };

        const onClick = (e: MouseEvent) => {
            if (isReadonly) return;
            e.stopPropagation();
            e.preventDefault();
            if (didDrag) {
                didDrag = false;
                return;
            }
            const box = canvasRef.current?.getBoundingClientRect();
            const x = e.clientX - (box?.left ?? 0);
            // const y = e.clientY - (box?.top ?? 0);

            synthSelector.setSelectedSynthLine(flavorSynthLine.uuid);
            const currentSecondClicked = calculateCurrentPosSeconds(x);
            let foundElement = null;
            for (const element of flavorSynthLine.elements) {
                if (currentSecondClicked >= element.from && currentSecondClicked <= element.to) {
                    foundElement = element;
                    break;
                }
            }
            if (e.shiftKey || e.ctrlKey || isTouch) {
                if (foundElement == null) {
                    synthLines.repaintAllElements();
                    // synthLines.repaintAll();
                    return;
                }
                if (synthSelector.selectedElementsRef.current == null) {
                    synthSelector.selectedElementsRef.current = [];
                }
                if (synthSelector.selectedElementsRef.current.findIndex(elUUID => elUUID == foundElement!.uuid) == -1) {
                    synthSelector.selectedElementsRef.current.push(foundElement.uuid!);
                } else if (isTouch) {
                    synthSelector.selectedElementsRef.current = [foundElement.uuid!];
                }
                // synthLines.repaintAll();
            } else {
                synthSelector.selectedElementsRef.current = foundElement ? [foundElement.uuid] : [];
            }
            // repaint();
            // renderElements();
            targetElement = null;
            synthLines.repaintAllElements();
            // synthLines.repaintAll();
        };

        const onKeyPress = (e: KeyboardEvent) => {
            if (isReadonly) return;
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
                    change.changed();
                    // synthLines.repaintAll();
                    break;
                case "Escape":
                    synthSelector.selectedElementsRef.current = [];
                    // synthLines.repaintAll();
                    break;
            }
            // repaint();
        };

        const onWheel = (e: WheelEvent) => {
            synthLines.onWheel(e);
            // repaint();
        };

        const onMouseLeave = () => {
            if (isReadonly) return;
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
                    interPlayerDrag.originalStartPos.current = null;
                    interPlayerDrag.offsetLeft.current = 0;
                    currentDraggingElementRef.current = null;
                    renderElementsWDebounce();
                    interPlayerDrag.onPlaced.current = () => 0;
                };
                interPlayerDrag.isEmptyRef.current = isEmpty;
            }
        };

        const onMouseEnter = () => {
            if (isReadonly) return;
            if (targetElement != null && interPlayerDrag.ref.current && flavorSynthLine.elements.includes(interPlayerDrag.ref.current)) {
                interPlayerDrag.ref.current = null;
                interPlayerDrag.originalStartPos.current = null;
                interPlayerDrag.offsetLeft.current = 0;
            }
        };

        const onMouseMoveExternalElement = (xOrg: number, _yOrg: number) => {
            if (isReadonly) return;
            if (interPlayerDrag.ref.current != null) {
                const canvasBox = canvasRef.current?.getBoundingClientRect();
                if (!canvasBox) return;
                const x = xOrg - canvasBox.left;
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

                renderElementsWDebounce();
            }
        };

        const onReleaseExternalElement = (xOrg: number, _yOrg: number) => {
            if (isReadonly) return;
            if (interPlayerDrag.ref.current != null) {
                const canvasBox = canvasRef.current?.getBoundingClientRect();
                if (!canvasBox) return;
                const x = xOrg - canvasBox.left;
                const seconds = calculateCurrentPosSeconds(x);
                const offset = interPlayerDrag.offsetLeft.current ?? 0;
                const currentDragPos = seconds - offset;
                const element = interPlayerDrag.ref.current;
                const elementSpan = element.to - element.from;
                const originalPos = interPlayerDrag.originalStartPos.current;

                const newFrom = currentDragPos;
                const newTo = currentDragPos + elementSpan

                if (!isEmpty(element, newFrom, newTo)) {
                    synthLines.repaintAllElements();
                    return;
                }

                const fromTrack = synthLines.synthLines.find(track => track.elements.map(e => e.uuid).includes(element.uuid));

                ActionHistoryManager.didAction({
                    type: "moveBetweenTracks",
                    flavor: element,
                    from: {
                        from: originalPos?.[0] ?? 0,
                        to: originalPos?.[1] ?? 0
                    },
                    to: {
                        from: newFrom,
                        to: newTo
                    },
                    fromTrackUUID: fromTrack?.uuid ?? "",
                    toTrackUUID: synthLineUUID
                });

                // synthLines.deleteElement(element.uuid);

                // element.from = newFrom;
                // element.to = newTo;
                flavorSynthLine.elements = [...flavorSynthLine.elements, { ...element, from: newFrom, to: newTo }];
                // flavorSynthLine.elements.push(element);


                interPlayerDrag.onPlaced.current();
                currentDraggingElementRef.current = null;
                // interPlayerDrag.ref.current = null;
                targetElement = null;
                change.changed();
            }
        };

        // const wheelArgs = {
        //     passive: true,
        //     capture: true
        // };

        const onMouseMoveWrapper = (e: MouseEvent) => onMouseMove(e.clientX, e.clientY);
        const onMouseDownWrapper = (e: MouseEvent) => onMouseDown(e.clientX, e.clientY);
        const onReleaseExternalElementWrapper = (e: MouseEvent) => onReleaseExternalElement(e.clientX, e.clientY);
        const onMouseMoveExternalElementWrapper = (e: MouseEvent) => onMouseMoveExternalElement(e.clientX, e.clientY);



        const getDiff = (pos1: Pos, pos2: Pos, axis: "x" | "y" | "xy") => axis == "x" ? pos2.x - pos1.x : (axis == "y" ? pos2.y - pos1.y : { x: pos2.x - pos1.x, y: pos2.y - pos1.y });

        const getTouch = (touches: TouchList | React.TouchList, index: number) => {
            const canvas = canvasRef.current?.getBoundingClientRect();
            const offsetX = canvas?.left ?? 0;
            const offsetY = canvas?.top ?? 0;
            return {
                x: touches[index].clientX - offsetX,
                y: touches[index].clientY - offsetY,
            }
        }



        const onTouchStartWrapper = (e: TouchEvent) => {
            const touches = Utils.getTouches(e);
            if (touches.length == 1) {
                startTime.current = Date.now();
                const touch = getTouch(touches, 0);
                mousePosRef.current = touch;
                startDraggedPositionTouch.current = mousePosRef.current;
                startDraggedPositionSecondsTouch.current = {
                    x: calculateCurrentPosSeconds(mousePosRef.current.x),
                    y: calculateCurrentPosSeconds(mousePosRef.current.y),
                }

                startedDragAtTimeline.current = touch.y < timelineOffCanvasRef.current.height;


                checkForPlaceNewFlavorPlaced:
                if (!startedDragAtTimeline.current) {
                    const posX = getTouch(touches, 0).x;
                    const seconds = calculateCurrentPosSecondsAccurate(posX);

                    // const synthLine = synthLines.synthLines.find(e => e.uuid == synthLineUUID);
                    const elementFromResize = flavorSynthLine.elements.find(e => Math.abs(e.from - seconds) <= 0.5);
                    const elementToResize = flavorSynthLine.elements.find(e => Math.abs(e.to - seconds) <= 0.5);
                    const elementClicked = flavorSynthLine.elements.find(e => e.from <= seconds && e.to >= seconds);

                    if ((elementFromResize && elementToResize) || (!elementFromResize && !elementToResize && !elementClicked)) {
                        currentlyResizingElement.current = null;
                        break checkForPlaceNewFlavorPlaced;
                    }


                    console.log(elementFromResize,
                        elementToResize,
                        elementClicked)

                    if (elementFromResize) {
                        resizeSide.current = "from";
                        currentlyResizingElement.current = elementFromResize.uuid;
                    } else if (elementToResize) {
                        resizeSide.current = "to";
                        currentlyResizingElement.current = elementToResize.uuid;
                    } else if (elementClicked) {
                        resizeSide.current = "move";
                        currentlyResizingElement.current = elementClicked.uuid;
                        startElementPos.current = elementClicked.from;
                    }
                    return;
                }

                if (currentDragging.currentDraggingElement.current && !startedDragAtTimeline.current) {
                    const pos = calculateCurrentPosSeconds(startDraggedPositionTouch.current.x);
                    if (isEmpty(currentDraggingElementRef.current, pos, pos + 1)) {
                        currentDraggingElementRef.current = createElementForFlavor(currentDragging.currentDraggingElement.current, pos, pos);
                        synthLines.repaintAllElements();
                        synthLines.repaintAllTimelines();
                    }
                    // synthLines.repaintAll();
                }
            }
        };

        const onTouchEndWrapper = (e: TouchEvent) => {
            const touches = Utils.getTouches(e);
            if (touches.length == 1) {
                const originalTouch = touches[0];
                const touch = getTouch(touches, 0);
                mousePosRef.current = touch;
                const diffX = getDiff(startDraggedPositionTouch.current, mousePosRef.current, "x") as number;
                console.log(currentDragging.currentDraggingElement.current);
                if (currentDragging.currentDraggingElement.current && !startedDragAtTimeline.current) {
                    // if (currentDraggingElementRef.current) currentDraggingElementRef.current.to = calculateCurrentPosSeconds(mousePosRef.current.x);
                    if (currentDraggingElementRef.current && currentDraggingElementRef.current.from != currentDraggingElementRef.current.to)
                        flavorSynthLine.elements = [...flavorSynthLine.elements, currentDraggingElementRef.current];

                    synthLines.repaintAllElements();
                    currentDraggingElementRef.current = null;
                    // synthLines.repaintAll();
                }

                if (Math.abs(diffX) <= 10 && startedDragAtTimeline.current) {
                    const seconds = calculateCurrentPosSecondsAccurate(touch.x);

                    currentPlaying.cusorPos.current = seconds;
                    synthLines.repaintAllTimelines();
                } else if (Math.abs(diffX) <= 10 && !startedDragAtTimeline.current && currentlyResizingElement.current != null) {
                    const timeElapsed = Date.now() - startTime.current;
                    if (timeElapsed > 200) {
                        if (synthSelector.selectedElementsRef.current.length <= 0) return;
                        openTouchMenu({
                            x: originalTouch.pageX,
                            y: touch.y
                        });
                    }
                }
                currentlyResizingElement.current = null;
                resizeSide.current = "from";

            }
            lastDeltaZoom = -1;
        };

        let lastDeltaZoom = -1;

        const onTouchMoveWrapper = (e: TouchEvent) => {
            const touches = Utils.getTouches(e);
            if (touches.length == 1) {
                const touch = getTouch(touches, 0);
                const deltaX = getDiff(touch, mousePosRef.current, "x") as number;
                mousePosRef.current = touch;
                const diffX = getDiff(startDraggedPositionTouch.current, mousePosRef.current, "x") as number;
                if (Math.abs(diffX) < 10) return;

                // Adding a Flavor
                if (!currentlyResizingElement.current && currentDragging.currentDraggingElement.current && !startedDragAtTimeline.current) {
                    if (currentDraggingElementRef.current) {
                        const newPos = calculateCurrentPosSeconds(mousePosRef.current.x);
                        console.log(
                            newPos,
                            currentDraggingElementRef.current.from,
                            currentDraggingElementRef.current.to
                        );

                        const startPosition = startDraggedPositionSecondsTouch.current.x;

                        const newFrom = Math.min(startPosition, newPos);
                        const newTo = Math.max(startPosition, newPos);

                        if (isEmpty(currentDraggingElementRef.current, newFrom, newTo)) {
                            currentDraggingElementRef.current.from = newFrom;
                            currentDraggingElementRef.current.to = newTo;
                        }
                        synthLines.repaintAllElements();
                        return;
                    }
                    // synthLines.repaintAll();
                }
                // Resizing
                if (startedDragAtTimeline.current) {
                    const offsetSeconds = convertPixelsToSeconds(deltaX);

                    const span = getSpan();

                    let newSpan: { from: number; to: number; } = {
                        from: span.from,
                        to: span.to
                    };

                    if (span.from + offsetSeconds < 0) {
                        const dist = span.to - span.from;
                        newSpan = {
                            from: 0,
                            to: Math.round(Math.abs(dist))
                        };
                    } else {
                        newSpan = {
                            from: span.from + offsetSeconds,
                            to: span.to + offsetSeconds,
                        };
                    }

                    newSpan = constrainSpan(newSpan);
                    setSpan(widthRef.current, newSpan);

                    synthLines.repaintAllTimelines();
                    synthLines.repaintAllElements();
                    // synthLines.repaintAll();
                    return;
                }
                // Otherwise resize element when there
                if (currentlyResizingElement.current && resizeSide.current != "move") {
                    const pos = getTouch(touches, 0);
                    const seconds = calculateCurrentPosSeconds(pos.x);

                    const element = flavorSynthLine.elements.find(e => e.uuid == currentlyResizingElement.current);

                    if (!element) return;

                    let newFrom = resizeSide.current == "from" ? seconds : element.from;
                    let newTo = resizeSide.current == "to" ? seconds : element.to;

                    if (newFrom < MIN_SPAN) newFrom = 0;
                    if (newTo < MIN_SPAN + 1) newTo = 1;
                    if (newTo > MAX_SPAN) newTo = MAX_SPAN;
                    if (newFrom > MAX_SPAN - 1) newFrom = MAX_SPAN - 1;

                    const width = newTo - newFrom;


                    if (width < 1) {
                        if (newFrom < MIN_SPAN + 1) {
                            newFrom = MIN_SPAN;
                            newTo = MIN_SPAN + 1;
                        } else {
                            newFrom--;
                        }
                    }

                    if (!isEmpty(element, newFrom, newTo)) {
                        return;
                    }

                    element.from = newFrom;
                    element.to = newTo;

                    // flavorSynthLine.elements = flavorSynthLine.elements.map(element => {
                    //     if (element.uuid !== currentlyResizingElement.current) return element;
                    //     return {
                    //         ...element,
                    //         from: resizeSide.current == "from" ? seconds : element.from,
                    //         to: resizeSide.current == "to" ? seconds : element.to
                    //     }
                    // });
                    // synthLines.setSynthLines(synthLines => synthLines.map(synthLine => {
                    //     if (synthLine.uuid !== synthLineUUID) return synthLine;
                    //     return {
                    //         ...synthLine,
                    //         elements: synthLine.elements.map(element => {
                    //             if (element.uuid !== currentlyResizingElement.current) return element;
                    //             return {
                    //                 ...element,
                    //                 from: resizeSide.current == "from" ? seconds : element.from,
                    //                 to: resizeSide.current == "to" ? seconds : element.to
                    //             }
                    //         })
                    //     }
                    // }));
                    synthLines.repaintAllElements();
                    // synthLines.repaintAll();
                    return;
                } else if (currentlyResizingElement.current) {
                    const pos = getTouch(touches, 0);
                    const seconds = calculateCurrentPosSeconds(pos.x);
                    const startPosSeconds = startDraggedPositionSecondsTouch.current.x;
                    const deltaSeconds = seconds - startPosSeconds;
                    const newFromPos = startElementPos.current + deltaSeconds;

                    const element = flavorSynthLine.elements.find(e => e.uuid == currentlyResizingElement.current);
                    if (!element) return;

                    const width = element.to - element.from;

                    if (newFromPos < 0) return;

                    if (!isEmpty(element, newFromPos, newFromPos + width)) {
                        return;
                    }

                    element.from = newFromPos;
                    element.to = newFromPos + width;

                    synthLines.repaintAllElements();
                    // synthLines.repaintAll();
                }
            } else if (touches.length == 2) {
                const touch1 = getTouch(touches, 0);
                const touch2 = getTouch(touches, 1);
                const deltaX = touch2.x - touch1.x;
                if (lastDeltaZoom == -1) {
                    lastDeltaZoom = deltaX;
                    return;
                }
                const centerX = touch2.x - touch1.x;
                const deltaZoom = deltaX - lastDeltaZoom;
                lastDeltaZoom = deltaX;
                console.log(deltaZoom);
                synthLines.zoomed(centerX, deltaZoom);
            }
        };

        const onTouchCancelWrapper = (e: TouchEvent) => {
            onTouchEndWrapper(e);
        };

        const onTouchOutsideCancel = () => {
            onMouseUpReset();
        }

        canvas.addEventListener("mousemove", onMouseMoveWrapper);
        canvas.addEventListener("mousedown", onMouseDownWrapper);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseup", onMouseUpReset);
        canvas.addEventListener("mouseleave", onMouseLeave);
        canvas.addEventListener("mouseenter", onMouseEnter);
        canvas.addEventListener("mouseup", onReleaseExternalElementWrapper);
        canvas.addEventListener("mousemove", onMouseMoveExternalElementWrapper);
        canvas.addEventListener("wheel", onWheel);
        canvas.addEventListener("click", onClick);
        canvas.addEventListener("contextmenu", (e) => e.preventDefault());
        window.addEventListener("mouseup", onMouseUpReset);


        canvas.addEventListener("touchstart", onTouchStartWrapper);
        canvas.addEventListener("touchend", onTouchEndWrapper);
        canvas.addEventListener("touchmove", onTouchMoveWrapper);
        canvas.addEventListener("touchcancel", onTouchCancelWrapper);

        window.addEventListener("touchend", onTouchOutsideCancel)



        window.addEventListener("keydown", onKeyPress);
        // repaint();

        return () => {
            canvas.removeEventListener("mousemove", onMouseMoveWrapper);
            canvas.removeEventListener("mousedown", onMouseDownWrapper);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("mouseup", onMouseUpReset);
            canvas.removeEventListener("mouseleave", onMouseLeave);
            canvas.removeEventListener("mouseenter", onMouseEnter);
            canvas.removeEventListener("mouseup", onReleaseExternalElementWrapper);
            canvas.removeEventListener("mousemove", onMouseMoveExternalElementWrapper);
            canvas.removeEventListener("wheel", onWheel);
            canvas.removeEventListener("click", onClick);
            canvas.removeEventListener("contextmenu", (e) => e.preventDefault());
            window.removeEventListener("mouseup", onMouseUpReset);


            canvas.removeEventListener("touchstart", onTouchStartWrapper);
            canvas.removeEventListener("touchend", onTouchEndWrapper);
            canvas.removeEventListener("touchmove", onTouchMoveWrapper);
            canvas.removeEventListener("touchcancel", onTouchCancelWrapper);

            window.removeEventListener("touchend", onTouchOutsideCancel)
            window.removeEventListener("keydown", onKeyPress);
        };

    }, [canvasRef.current, flavorSynthLine.elements]);



    function isEmpty(element: FlavorElement | null, from: number, to?: number): boolean {
        if (from < 0) return false;
        const toCheck = flavorSynthLine?.elements.filter(e => e !== element);
        if (!toCheck) return false;
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
        if (isReadonly) return;
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
        // const y = e.clientY - (box?.top ?? 0);

        const currentPos = calculateCurrentPosSeconds(x - offsetImage.offsetX);


        if (isEmpty(null, currentPos, currentPos + elementLength) == false) {
            let startPos = -1;
            let endPos = -1;
            for (let start = 0; start <= elementLength; start++) {
                if (isEmpty(null, currentPos + start)) {
                    startPos = startPos == -1 ? currentPos + start : Math.min(startPos, currentPos + start);
                    endPos = Math.max(endPos, currentPos + start);
                } else {
                    if (startPos != -1) break;
                }
            }


            if (startPos != -1 && endPos != -1 && startPos != endPos) {
                const element = createElementForFlavor(flavorName, startPos, endPos);
                flavorSynthLine.elements.push(element);
                droppedNewFlavor(element)
                change.changed();
            }
            currentDraggingElementRef.current = null;
            renderElementsWDebounce();
            synthLines.updateTotalStatistic();
            return;
        }
        const element = createElementForFlavor(flavorName, currentPos, currentPos + elementLength);
        flavorSynthLine.elements.push(element);
        change.changed();
        droppedNewFlavor(element);
        currentDraggingElementRef.current = null;
        renderElementsWDebounce();
        synthLines.updateTotalStatistic();
    };

    const droppedNewFlavor = (element: FlavorElement) => {
        if (isReadonly) return;
        ActionHistoryManager.didAction({
            type: "insert",
            flavor: element,
            trackUUID: synthLineUUID
        });
    }

    const onDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
        if (isReadonly) return;
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
            // const y = e.clientY - (box?.top ?? 0);

            const currentPos = calculateCurrentPosSeconds(x - offsetImage.offsetX);

            if (isEmpty(null, currentPos, currentPos + elementLength) == false) {
                let startPos = -1;
                let endPos = -1;
                for (let start = 0; start <= elementLength; start++) {
                    if (isEmpty(null, currentPos + start)) {
                        startPos = startPos == -1 ? currentPos + start : Math.min(startPos, currentPos + start);
                        endPos = Math.max(endPos, currentPos + start);
                    } else {
                        if (startPos != -1) break;
                    }
                }


                if (startPos != -1 && endPos != -1 && startPos != endPos) {
                    currentDraggingElementRef.current = createElementForFlavor(flavorName, startPos, endPos);
                    e.preventDefault();
                    renderElementsWDebounce();
                    return;
                }

                currentDraggingElementRef.current = null;
                renderElementsWDebounce();
                return;
            }

            currentDraggingElementRef.current = createElementForFlavor(flavorName, currentPos, currentPos + elementLength);

            e.preventDefault();
        } catch (ex) {
            currentDraggingElementRef.current = null;
        }
        renderElementsWDebounce();
    };

    const onDragLeave = () => {
        if (isReadonly) return;
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
    flavor: Flavor;
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

// function drawRect(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string = "black") {
//     if (ctx) {
//         ctx.fillStyle = color;
//         ctx.rect(x, y, width, height);
//     }
// }

// function drawCircle(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, radius: number, color: string = "black") {
//     if (ctx) {
//         ctx.fillStyle = color;
//         ctx.beginPath();
//         ctx.arc(x, y, radius, 0, Math.PI * 2);
//         ctx.stroke();
//     }
// }

// function drawLine(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string = "black", lineWidth: number = 1) {
//     if (ctx) {
//         ctx.strokeStyle = color;
//         ctx.lineWidth = lineWidth;
//         ctx.beginPath();
//         ctx.moveTo(x1, y1);
//         ctx.lineTo(x2, y2);
//         ctx.stroke();
//     }
// }

// function fillRect(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string = "black") {
//     if (ctx) {
//         ctx.fillStyle = color;
//         ctx.fillRect(x, y, width, height);
//     }
// }

// function fillCircle(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, radius: number, color: string = "black") {
//     if (ctx) {
//         ctx.fillStyle = color;
//         ctx.beginPath();
//         ctx.arc(x, y, radius, 0, Math.PI * 2);
//         ctx.fill();
//     }
// }


// function fillCanvas(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvas: HTMLCanvasElement | OffscreenCanvas, color: string = "white") {
//     if (ctx) {
//         ctx.fillStyle = color;
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
//     }
// }
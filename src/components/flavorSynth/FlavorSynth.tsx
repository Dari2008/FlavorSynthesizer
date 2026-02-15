import { useEffect, useRef, useState } from "react"
import { SynthLinesContext } from "../../contexts/SynthLinesContext";
import { calculateCurrentPosSeconds, constrainSpan, setSpan } from "../FlavorUtils";
import type { FlavorElement } from "./PlayerTrack";
import { ElementPlayer } from "./ElementPlayer";
import * as Tone from "tone";
import "./FlavorSynth.scss"
import "./FlavorSynthControls.scss";
import { getMainFlavorByName } from "../../audio/Flavors";
import { CurrentInterPlayerDragContext } from "../../contexts/CurrentInterPlayerDragContext";
import { SynthSelectorContext } from "../../contexts/SynthSelectorContext";
import { CurrentlyPlayingContext } from "../../contexts/CurrentlyPlayingContext";
import SynthLine from "./synthLine/SynthLine";
import FlavorStatistic from "./flavorStatistic/FlavorStatistic";
import ControlKnob from "./controlKnob/ControlKnob";
import { SynthChangeContext } from "../../contexts/SynthChangeContext";
import { useTitle } from "../../contexts/TitleContext";
import { useMainFlavor } from "../../contexts/MainFlavorContext";
import { useGameState } from "../../contexts/GameStateContext";
import { useDishes } from "../../contexts/DishesContext";
import { useCurrentDishActions } from "../../contexts/DishActions";
import type { Flavor } from "../../@types/Flavors";
import { ActionHistoryManager } from "./actionHistory/ActionHistoryManager";
import { useCurrentDish } from "../../contexts/CurrentDish";


type EventListWithUUID<T> = {
    [uuid: string]: T;
};
const SKIP_SIZE = 1;

export default function FlavorSynth() {
    // const [synthLines, setSynthLines] = synthLinesWrapped;
    const widthRef = useRef<number>(getCurrentTrackWidth());
    const currentSpanRef = useRef<CurrentSpan>({ from: 0, to: 60 });
    const currentZoomRef = useRef<number>(1);
    const focusedSynthRef = useRef<string | null>(null);
    const selectedElementsRef = useRef<{ uuid: string }[]>([]);
    const playerRef = useRef<ElementPlayer>(new ElementPlayer());
    const [isPlaying, setPlaying] = useState<boolean>(false);
    const isPlayingRef = useRef<boolean>(false);
    const isSoloPlay = useRef<boolean>(false);
    const currentPositionRef = useRef<number>(0);
    const currentPlayingOffsetRef = useRef<number>(0);
    const currentFrameId = useRef<number>(-1);

    const mainFlavor = useMainFlavor();
    const gameState = useGameState();

    const mainFlavorsPlayer = getMainFlavorByName(mainFlavor.mainFlavor);
    const synthSelectionChangeCallbacks = useRef<EventListWithUUID<() => void>>({});
    const synthRepaintCallbacks = useRef<EventListWithUUID<() => void>>({});
    const currentPosRepainters = useRef<EventListWithUUID<() => void>>({});
    const timelineRepainters = useRef<EventListWithUUID<() => void>>({});
    const elementsRepainters = useRef<EventListWithUUID<() => void>>({});
    const collisionCheckerCallbacks = useRef<EventListWithUUID<(fromOffset: number, toOffset: number) => boolean>>({});
    const onElementMoveCallbacks = useRef<EventListWithUUID<(secondsOffset: number) => void>>({});
    const resizeCallbacks = useRef<EventListWithUUID<(fromOffset: number, toOffset: number) => void>>({});
    const stopDraggingCallbacks = useRef<EventListWithUUID<() => void>>({});
    const cusorPos = useRef<number>(0);

    const currentPlayingFlavorCountRef = useRef<HTMLSpanElement>(null)
    const totalAmountOfFlavorsRef = useRef<HTMLSpanElement>(null)

    const currentDragingRef = useRef<FlavorElement>(null);
    const originalStartPos = useRef<[number, number]>(null);
    const currentDragingOffsetRef = useRef<number>(0);
    const currentDraggingOnPlacedRef = useRef<() => void>(() => 0);
    const currentDraggingIsEmptyRef = useRef<(element: FlavorElement | null, from: number, to?: number) => boolean>(() => false);

    const statisticLoopInterval = useRef<number>(-1);

    const { title, setTitle } = useTitle();
    const dishes = useDishes();
    const dishActions = useCurrentDishActions();

    const [synthLines, setSynthLines] = dishActions.synthLines;
    const [volumes, setVolumes] = dishActions.volumes;



    playerRef.current.onStop = () => {
        setPlaying(false);
        isPlayingRef.current = false;
        stop();
    };

    const addSynth = () => {
        const uuid = crypto.randomUUID();
        const synthLine: FlavorSynthLine = {
            uuid: uuid,
            elements: [],
            muted: false,
            volume: 1,
            solo: false
        };
        setSynthLines(synthLines => [...synthLines, synthLine]);
        ActionHistoryManager.didAction({
            type: "addedTrack",
            track: structuredClone(synthLine)
        });
    };

    const deleteSynth = (uuid: string) => {
        // if (!currentDish) return;
        // currentDish.data = currentDish.data.filter(e => e.uuid !== uuid);
        const track = synthLines.find(e => e.uuid === uuid);
        if (!track) return;
        ActionHistoryManager.didAction({
            type: "removedTrack",
            track: structuredClone(track)
        });
        setSynthLines(synthLines => synthLines.filter(e => e.uuid !== uuid));
    }

    const deleteElement = (uuid: string) => {
        // if (!currentDish) return;
        // currentDish.data = currentDish.data.map(e => {
        //     e.elements = e.elements.filter(e => e.uuid !== uuid);
        //     return e;
        // });
        setSynthLines(synthLines => synthLines.map(e => {
            return { ...e, elements: e.elements.filter(e => e.uuid !== uuid) };
        }));
    }

    const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();

            const zoomFactor = 1 + (e.deltaY * 0.001);

            let newSpanWidth = (currentSpanRef.current.to - currentSpanRef.current.from) * zoomFactor;
            if (newSpanWidth < 10) return;
            if (newSpanWidth > 300) return;
            const zoomInOnSecond = calculateCurrentPosSeconds(e.clientX - getCurrentControlsWidth());
            const distanceLeftSeconds = zoomInOnSecond - currentSpanRef.current.from;
            const distanceRightSeconds = currentSpanRef.current.to - zoomInOnSecond;
            const distanceLeftPercent = distanceLeftSeconds / (distanceLeftSeconds + distanceRightSeconds);
            const distanceRightPercent = distanceRightSeconds / (distanceLeftSeconds + distanceRightSeconds);

            const distanceLeft = distanceLeftPercent * newSpanWidth;
            const distanceRight = distanceRightPercent * newSpanWidth;

            currentSpanRef.current.from = zoomInOnSecond - distanceLeft;
            currentSpanRef.current.to = zoomInOnSecond + distanceRight;

            currentSpanRef.current = constrainSpan(currentSpanRef.current);

            setSpan(widthRef.current, currentSpanRef.current);

            currentZoomRef.current *= zoomFactor;

            repaintAllTimelines();
            repaintAllElements();
        } else if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            const offsetSeconds = e.deltaY * 0.002 * currentZoomRef.current;
            if (currentSpanRef.current.from + offsetSeconds < 0) {
                const dist = currentSpanRef.current.to - currentSpanRef.current.from;
                currentSpanRef.current.from = 0;
                currentSpanRef.current.to = Math.round(Math.abs(dist));
            } else {
                currentSpanRef.current.from += offsetSeconds;
                currentSpanRef.current.to += offsetSeconds;
            }
            currentSpanRef.current = constrainSpan(currentSpanRef.current);
            setSpan(widthRef.current, currentSpanRef.current);

            repaintAllTimelines();
            repaintAllElements();
        }
        // Object.values(synthRepaintCallbacks).forEach(cb => cb());
    };

    useEffect(() => {
        setSpan(widthRef.current, currentSpanRef.current);
        repaintAllTimelines();
        repaintAllElements();
    }, []);

    const repaintAllTimelines = () => {
        Object.values(timelineRepainters.current).forEach(e => e());
    }

    const repaintAllElements = () => {
        Object.values(elementsRepainters.current).forEach(e => e());
    };

    const setSelectedSynthLine = (uuid: string | null) => {
        focusedSynthRef.current = uuid;
        Object.values(synthSelectionChangeCallbacks.current).forEach(cb => cb());
    }

    const addSynthSelectionChange = (uuid: string, cb: () => void) => {
        synthSelectionChangeCallbacks.current[uuid] = cb;
    }

    const addSynthRepainter = (uuid: string, sr: () => void) => {
        synthRepaintCallbacks.current[uuid] = sr;
    };

    const repaintAll = () => {
        Object.values(synthRepaintCallbacks.current).forEach(cb => cb());
    };

    const deleteSelectedElements = () => {
        const selectedUUIDs = selectedElementsRef.current.map(e => e.uuid);

        const elementsDeleted = synthLines.map(synthLine => {
            const elements = synthLine.elements.filter(el => selectedUUIDs.indexOf(el.uuid) !== -1);
            if (elements.length == 0) return undefined;
            return {
                trackUUID: synthLine.uuid,
                flavors: structuredClone(elements)
            };
        }).filter(e => !!e);

        if (!elementsDeleted || elementsDeleted.length == 0) return;
        ActionHistoryManager.didAction({
            type: "delete",
            elements: elementsDeleted
        })
        setSynthLines(lines => lines.map(line => {
            return { ...line, elements: line.elements.filter(el => selectedUUIDs.indexOf(el.uuid) == -1) };
        }));
    };

    const addCollisionCheckerCallback = (uuid: string, cb: (fromOffset: number, toOffset: number) => boolean) => {
        collisionCheckerCallbacks.current[uuid] = cb;
    };

    const addOnElementMove = (uuid: string, cb: (secondsOffset: number) => void) => {
        onElementMoveCallbacks.current[uuid] = cb;
    };

    const addOnElementResize = (uuid: string, cb: (fromOffset: number, toOffset: number) => void) => {
        resizeCallbacks.current[uuid] = cb;
    }

    const addCurrentPositionRepainter = (uuid: string, cb: () => void) => {
        currentPosRepainters.current[uuid] = cb;
    };

    const addTimelineRepainter = (uuid: string, cb: () => void) => {
        timelineRepainters.current[uuid] = cb;
    };

    const addElementsRepainter = (uuid: string, cb: () => void) => {
        elementsRepainters.current[uuid] = cb;
    };

    const repaintAllCurrentPositions = () => {
        Object.values(currentPosRepainters.current).forEach(e => e());
    }

    const moveAll = (secondsOffset: number) => {
        Object.values(onElementMoveCallbacks.current).forEach(cb => cb(secondsOffset));
    };

    const resizeAll = (fromOffset: number, toOffset: number) => {
        Object.values(resizeCallbacks.current).forEach(cb => cb(fromOffset, toOffset));
    };


    const canOffsetAll = (fromOffset: number, toOffset: number): boolean => {
        for (const cb of Object.values(collisionCheckerCallbacks.current)) {
            if (!cb(fromOffset, toOffset)) return false;
        }
        return true;
    };

    const undo = () => {
        ActionHistoryManager.undo(setSynthLines);
    };

    const redo = () => {
        console.log(synthLines);
        ActionHistoryManager.redo(setSynthLines);
    };

    useEffect(() => {
        const render = () => {
            repaintAll();
            currentFrameId.current = requestAnimationFrame(render);
        };
        currentFrameId.current = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(currentFrameId.current);
        };
    }, []);

    const play = () => {

        Tone.getTransport().stop();
        Tone.getTransport().position = "0:0:0";
        Tone.getTransport().bpm.value = 110;

        const containsSolo = synthLines.filter(e => e.solo).length > 0;
        isSoloPlay.current = containsSolo;
        const elements = synthLines.filter(e => (e.solo && containsSolo) || !containsSolo).filter(e => e.volume != 0).filter(e => !e.muted).flatMap(line => line.elements.map(el => ({ ...el, lineUuid: line.uuid })));
        if (elements.length == 0) return;
        playerRef.current.stop();
        playerRef.current.setVolumes(volumes.current);
        playerRef.current.loadElements(elements);

        if (!containsSolo) {
            mainFlavorsPlayer?.setVolumes(volumes.current);
            mainFlavorsPlayer?.play(cusorPos.current);
        }

        playerRef.current.play(cusorPos.current);
        setPlaying(true);
        isPlayingRef.current = true;
        currentPlayingOffsetRef.current = Tone.now() - cusorPos.current;
        repaintAllCurrentPositions();
        startStatisticLoop();
        Tone.getTransport().start("0", "0:0:0");
        Tone.start();
    };

    const skip = (n: number) => {

        const containsSolo = synthLines.filter(e => e.solo).length > 0;
        isSoloPlay.current = containsSolo;

        currentPlayingOffsetRef.current = currentPlayingOffsetRef.current + n;

        playerRef.current.stop();
        playerRef.current.play(currentPlayingOffsetRef.current);
        if (!containsSolo) {
            mainFlavorsPlayer?.setVolumes(volumes.current);
            mainFlavorsPlayer?.play(currentPlayingOffsetRef.current);
        }
    };

    const stop = () => {
        playerRef.current.stop();
        setPlaying(false);
        isPlayingRef.current = false;
        repaintAllCurrentPositions();
        mainFlavorsPlayer?.stop();
        stopStatisticLoop();
        Tone.getTransport().stop();
    }

    const currentPlayChanged = () => {
        currentPositionRef.current = Tone.now() - currentPlayingOffsetRef.current;
        if (!isPlaying) return;
        repaintAllCurrentPositions();
    };

    useEffect(() => {
        const clock = new Tone.Clock(() => {
            currentPlayChanged();
        }, 100)
        clock.start();

        return () => {
            clock.stop();
            clock.dispose();
        };
    }, []);


    const mainFlavorVolumeChanged = (volume: number) => {
        setVolumes(volumes => {
            playerRef.current.setVolumes(volumes);
            mainFlavorsPlayer?.setVolumes(volumes);
            return { ...volumes, mainFlavor: volume };
        });
        onSynthLineChanged();
    };


    const masterVolumeChanged = (volume: number) => {
        setVolumes(volumes => {
            playerRef.current.setVolumes(volumes);
            mainFlavorsPlayer?.setVolumes(volumes);
            return { ...volumes, master: volume };
        });
        onSynthLineChanged();
    };


    const flavorsVolumeChanged = (volume: number) => {
        setVolumes(volumes => {
            playerRef.current.setVolumes(volumes);
            mainFlavorsPlayer?.setVolumes(volumes);
            return { ...volumes, flavors: volume };
        });
        onSynthLineChanged();
    };


    const onSkipPrev = () => {
        skip(-SKIP_SIZE);
    };

    const onSkipNext = () => {
        skip(SKIP_SIZE);
    };


    const stopAllDragging = () => {
        Object.values(stopDraggingCallbacks.current).forEach(e => e());
    }

    const addStopDraggingCallback = (uuid: string, cb: () => void) => {
        stopDraggingCallbacks.current[uuid] = cb;
    };

    useEffect(() => {
        const keydown = (e: KeyboardEvent) => {
            if (e.code == "Space") {
                setPlaying(playing => {
                    playing ? stop() : play();
                    return !playing;
                })
                e.preventDefault();
            } else if (e.key == "z" && e.ctrlKey) {
                undo();
                e.preventDefault();
            } else if (e.key == "y" && e.ctrlKey) {
                redo();
                e.preventDefault();
            }

        };

        const mouseRelease = (e: MouseEvent) => {
            if (e.target instanceof HTMLCanvasElement && (e.target as HTMLCanvasElement).classList.contains("trackCanvas")) return;
            currentDragingRef.current = null;
            stopAllDragging();
            repaintAllElements();
        };

        window.addEventListener("keydown", keydown);
        window.addEventListener("mouseup", mouseRelease);
        return () => {
            window.removeEventListener("keydown", keydown);
            window.removeEventListener("mouseup", mouseRelease);
        };
    }, [synthLines]);

    useEffect(() => {
        const onResize = () => {
            widthRef.current = getCurrentTrackWidth();
        };

        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
        }
    }, []);


    const startStatisticLoop = () => {
        statisticLoopInterval.current = setInterval(() => {
            updateCurrentPlayingStatistic();
        }, 50);
    };

    const stopStatisticLoop = () => {
        if (statisticLoopInterval.current != -1) {
            clearInterval(statisticLoopInterval.current);
            statisticLoopInterval.current = -1;
        }
    };


    const onSynthLineChanged = () => {
        if (title.startsWith("*")) return;
        setTitle("*" + title);
    };

    const updateTotalStatistic = () => {
        if (totalAmountOfFlavorsRef.current) {
            totalAmountOfFlavorsRef.current.textContent = synthLines.map(e => e.elements.length).reduce((a, b) => a + b, 0) + " flavors";
        }
    }

    const updateCurrentPlayingStatistic = () => {
        if (currentPlayingFlavorCountRef.current) {
            const now = Tone.now();
            const currentPos = now - currentPlayingOffsetRef.current;
            currentPlayingFlavorCountRef.current.textContent = synthLines.map(e => e.elements.filter(element => {
                return element.from <= currentPos && currentPos <= element.to;
            }).length).reduce((a, b) => a + b, 0) + " flavors";
        }
    }

    return <>
        <SynthChangeContext.Provider value={{ changed: onSynthLineChanged }}>
            <SynthLinesContext.Provider value={{
                delete: deleteSynth,
                onWheel,
                addSynthRepainter,
                repaintAll,
                deleteSelectedElements,
                addCollisionCheckerCallback,
                addOnElementMove,
                addOnElementResize,
                moveAll,
                resizeAll,
                canOffsetAll,
                addCurrentPositionRepainter,
                addTimelineRepainter,
                addElementsRepainter,
                deleteElement,
                repaintAllTimelines,
                repaintAllElements,
                addStopDraggingCallback,
                updateTotalStatistic,
                updateCurrentPlayingStatistic,
                synthLines,
                setSynthLines
            }}>
                <SynthSelectorContext.Provider value={{ setSelectedSynthLine, focusedSynthRef, selectedElementsRef, addSynthSelectionChange }}>
                    <CurrentlyPlayingContext.Provider value={{ isSoloPlay, isPlayingRef, currentPositionRef, cusorPos }}>
                        <CurrentInterPlayerDragContext.Provider value={{ ref: currentDragingRef, originalStartPos, offsetLeft: currentDragingOffsetRef, onPlaced: currentDraggingOnPlacedRef, isEmptyRef: currentDraggingIsEmptyRef }}>
                            <div className="flavor-synth">
                                <div className="lines">
                                    {
                                        Object.values(synthLines).map(e => <SynthLine key={e.uuid} synthLineUUID={e.uuid} widthRef={widthRef} currentScrolledRef={currentSpanRef}></SynthLine>)
                                    }
                                </div>
                                <button className="addLine" onClick={() => addSynth()}>
                                    <img src="./imgs/plus/plus.png" alt="+" className="plus" />
                                </button>
                            </div>

                            <div className="flavor-synth-controls">
                                <div className="statistics">
                                    <div className="activeFlavorsPlaying">
                                        <FlavorStatistic imgSrc="./imgs/stack.png" unit="flavors" value={0} desc="The number of currently playing flavors" ref={currentPlayingFlavorCountRef} />
                                    </div>
                                    <div className="totalFlavorsUsed">
                                        <FlavorStatistic imgSrc="./imgs/total.png" unit="flavors" value={synthLines.map(e => e.elements.length).reduce((a, b) => a + b, 0)} desc="The number of total flavors used" ref={totalAmountOfFlavorsRef} />
                                    </div>
                                </div>
                                <button className="skip-prev" title="Skip 1s back" onClick={onSkipPrev}>
                                    <img src="./imgs/actionButtons/prev.png" alt="previous btn" className="action-btn prev-img" />
                                </button>
                                <button className="play" onClick={() => { isPlaying ? stop() : play(); }}>{
                                    isPlaying
                                        ?
                                        <img src="./imgs/actionButtons/pause.png" alt="pause btn" className="action-btn pause-ptn" />
                                        :
                                        <img src="./imgs/actionButtons/play.png" alt="play btn" className="action-btn play-ptn" />
                                }
                                </button>
                                <button className="skip-next" title="Skip 1s forward" onClick={onSkipNext}>
                                    <img src="./imgs/actionButtons/next.png" alt="next btn" className="action-btn next-img" />
                                </button>
                                <div className="volumes">
                                    <div className="volume">
                                        <ControlKnob classNames="flavors" label="Flavors" onValueChanged={flavorsVolumeChanged}></ControlKnob>
                                    </div>
                                    <div className="mainFlavorVolume">
                                        <ControlKnob classNames="main-flavors" label="Main Flavor" onValueChanged={mainFlavorVolumeChanged}></ControlKnob>
                                    </div>
                                    <div className="masterVolume">
                                        <ControlKnob classNames="master-flavors" label="Master" onValueChanged={masterVolumeChanged}></ControlKnob>
                                    </div>
                                </div>
                                <div className="buttons">
                                    <button className="share" onClick={() => gameState.setGameState("createDish-share")}>
                                        <img src="./imgs/actionButtons/share.png" alt="Share btn" className="share-action action-btn" />
                                    </button>
                                    <button className="save" onClick={dishes.saveCurrentDish}>
                                        <img src="./imgs/actionButtons/save.png" alt="Save btn" className="save-action action-btn" />
                                    </button>
                                </div>
                            </div>

                        </CurrentInterPlayerDragContext.Provider>
                    </CurrentlyPlayingContext.Provider>
                </SynthSelectorContext.Provider>
            </SynthLinesContext.Provider>
        </SynthChangeContext.Provider>
    </>
}

export type FlavorSynthLine = {
    uuid: string;
    elements: FlavorElement[];
    volume: number;
    muted: boolean;
    solo: boolean;
}

export type CurrentSpan = {
    from: number;
    to: number;
}

function getCurrentTrackWidth() {
    let controlsWidth = (window.innerWidth - 300) * 0.1;
    if (controlsWidth > 100) controlsWidth = 100;
    if (controlsWidth < 50) controlsWidth = 50;
    let restWidth = window.innerWidth - 300 - controlsWidth - 20;
    return restWidth;
}

function getCurrentControlsWidth() {
    let controlsWidth = (window.innerWidth - 300) * 0.1;
    if (controlsWidth > 100) controlsWidth = 100;
    if (controlsWidth < 50) controlsWidth = 50;
    return controlsWidth;
}

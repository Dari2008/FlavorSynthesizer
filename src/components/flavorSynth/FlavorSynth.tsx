import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { SynthLinesContext } from "../../contexts/SynthLinesContext";
import { calculateCurrentPosSeconds, constrainSpan, convertScreenXToTimeline, getOffsetX, getPixelsPerSecond, setPixelsPerSecond, setSpan } from "../FlavorUtils";
import type { FlavorElement } from "./PlayerTrack";
import { ElementPlayer } from "./ElementPlayer";
import * as Tone from "tone";
import "./FlavorSynth.scss"
import "./FlavorSynthControls.scss";
import { getMainFlavorByName, MAIN_FLAVORS } from "../../audio/Flavors";
import type { MainFlavor } from "../../@types/Flavors";
import { VolumeContext, type Volumes } from "../../contexts/VolumeContext";
import { CurrentInterPlayerDragContext } from "../../contexts/CurrentInterPlayerDragContext";
import { SynthSelectorContext } from "../../contexts/SynthSelectorContext";
import { CurrentlyPlayingContext } from "../../contexts/CurrentlyPlayingContext";
import SynthLine from "./synthLine/SynthLine";
import FlavorStatistic from "./flavorStatistic/FlavorStatistic";
import ControlKnob from "./controlKnob/ControlKnob";
import { useCurrentDish } from "../../contexts/CurrentDish";
import { SynthChangeContext } from "../../contexts/SynthChangeContext";
import { useTitle } from "../../contexts/TitleContext";
import { useUser } from "../../contexts/UserContext";
import useJsObjectHook, { useJsObjectHookForArray } from "../../hooks/JsObjectHook";
import type { Dish } from "../../@types/User";
import { useMainFlavor } from "../../contexts/MainFlavorContext";
import { useGameState } from "../../contexts/GameStateContext";


type EventListWithUUID<T> = {
    [uuid: string]: T;
};

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
    const volumesRef = useRef<Volumes>({
        flavors: 100,
        mainFlavor: 100,
        master: 100
    });

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

    const currentDragingRef = useRef<FlavorElement | null>(null);
    const currentDragingOffsetRef = useRef<number>(0);
    const currentDraggingOnPlacedRef = useRef<() => void>(() => 0);
    const currentDraggingIsEmptyRef = useRef<(element: FlavorElement | null, from: number, to?: number) => boolean>(() => false);

    const { title, setTitle } = useTitle();
    const { saveDishes } = useUser();
    const currentDish = useCurrentDish();

    const [synthLines, setSynthLines, addSynthLine] = useJsObjectHookForArray<FlavorSynthLine, Dish>([], currentDish, "data");

    window.onresize = () => {
        widthRef.current = getCurrentTrackWidth();
    };

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
        addSynthLine(synthLine);
    };

    const deleteSynth = (uuid: string) => {
        // if (!currentDish) return;
        // currentDish.data = currentDish.data.filter(e => e.uuid !== uuid);
        setSynthLines([...synthLines.filter(e => e.uuid !== uuid)]);
    }

    const deleteElement = (uuid: string) => {
        // if (!currentDish) return;
        // currentDish.data = currentDish.data.map(e => {
        //     e.elements = e.elements.filter(e => e.uuid !== uuid);
        //     return e;
        // });
        setSynthLines([...synthLines.map(e => {
            e.elements = e.elements.filter(e => e.uuid !== uuid);
            return e;
        })]);
    }

    const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();

            const zoomFactor = 1 + (e.deltaY * 0.001);

            let newSpanWidth = (currentSpanRef.current.to - currentSpanRef.current.from) * zoomFactor;
            if (newSpanWidth < 10) return;
            if (newSpanWidth > 300) return;
            console.log(getCurrentControlsWidth());
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

    setSpan(widthRef.current, currentSpanRef.current);

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
        synthLines.forEach(synthLine => {
            synthLine.elements = synthLine.elements.filter(el => selectedUUIDs.indexOf(el.uuid) == -1);
        });
        setSynthLines([...synthLines]);
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

        const containsSolo = synthLines.filter(e => e.solo).length > 0;
        isSoloPlay.current = containsSolo;
        const elements = synthLines.filter(e => (e.solo && containsSolo) || !containsSolo).filter(e => e.volume != 0).filter(e => !e.muted).flatMap(line => line.elements.map(el => ({ ...el, lineUuid: line.uuid })));
        if (elements.length == 0) return;
        playerRef.current.stop();
        playerRef.current.setVolumes(volumesRef.current);
        playerRef.current.loadElements(elements);

        if (!containsSolo) {
            mainFlavorsPlayer?.setVolumes(volumesRef.current);
            mainFlavorsPlayer?.play(cusorPos.current);
        }

        playerRef.current.play(cusorPos.current);
        setPlaying(true);
        isPlayingRef.current = true;
        currentPlayingOffsetRef.current = Tone.now() - cusorPos.current;
        repaintAllCurrentPositions();
    };

    const stop = () => {
        playerRef.current.stop();
        setPlaying(false);
        isPlayingRef.current = false;
        repaintAllCurrentPositions();
        mainFlavorsPlayer?.stop();
    }

    const currentPlayChanged = () => {
        currentPositionRef.current = Tone.now() - currentPlayingOffsetRef.current;
        if (!isPlaying) return;
        repaintAllCurrentPositions();
    };

    const clock = new Tone.Clock(() => {
        currentPlayChanged();
    }, 100)
    clock.start();

    const mainFlavorVolumeChanged = (volume: number) => {
        volumesRef.current.mainFlavor = volume;
        playerRef.current.setVolumes(volumesRef.current);
        mainFlavorsPlayer?.setVolumes(volumesRef.current);
    };


    const masterVolumeChanged = (volume: number) => {
        volumesRef.current.master = volume;
        playerRef.current.setVolumes(volumesRef.current);
        mainFlavorsPlayer?.setVolumes(volumesRef.current);
    };


    const flavorsVolumeChanged = (volume: number) => {
        volumesRef.current.flavors = volume;
        playerRef.current.setVolumes(volumesRef.current);
        mainFlavorsPlayer?.setVolumes(volumesRef.current);
    };


    const stopAllDragging = () => {
        Object.values(stopDraggingCallbacks.current).forEach(e => e());
    }

    const addStopDraggingCallback = (uuid: string, cb: () => void) => {
        stopDraggingCallbacks.current[uuid] = cb;
    };

    useEffect(() => {
        const keydown = (e: KeyboardEvent) => {
            if (e.key == " ") {
                if (isPlayingRef.current) {
                    stop();
                } else {
                    play();
                }
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
    }, []);


    const onSynthLineChanged = () => {
        if (title.startsWith("*")) return;
        setTitle("*" + title);
    };

    return <>
        <SynthChangeContext.Provider value={{ changed: onSynthLineChanged, saveFlavorSynth: saveDishes }}>
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
                addStopDraggingCallback
            }}>
                <SynthSelectorContext.Provider value={{ setSelectedSynthLine, focusedSynthRef, selectedElementsRef, addSynthSelectionChange }}>
                    <CurrentlyPlayingContext.Provider value={{ isSoloPlay, isPlayingRef, currentPositionRef, cusorPos }}>
                        <VolumeContext.Provider value={volumesRef.current}>
                            <CurrentInterPlayerDragContext.Provider value={{ ref: currentDragingRef, offsetLeft: currentDragingOffsetRef, onPlaced: currentDraggingOnPlacedRef, isEmptyRef: currentDraggingIsEmptyRef }}>
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
                            </CurrentInterPlayerDragContext.Provider>
                        </VolumeContext.Provider>
                    </CurrentlyPlayingContext.Provider>
                </SynthSelectorContext.Provider>
            </SynthLinesContext.Provider>
            <div className="flavor-synth-controls">
                <div className="statistics">
                    <div className="activeFlavorsPlaying">
                        <FlavorStatistic imgSrc="./imgs/stack.png" unit="flavors" value={0} desc="The number of currently playing flavors"></FlavorStatistic>
                    </div>
                    <div className="totalFlavorsUsed">
                        <FlavorStatistic imgSrc="./imgs/total.png" unit="flavors" value={synthLines.map(e => e.elements.length).reduce((a, b) => a + b, 0)} desc="The number of total flavors used"></FlavorStatistic>
                    </div>
                </div>
                <button className="skip-prev">
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
                <button className="skip-next">
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
                    <button className="save" onClick={saveDishes}>
                        <img src="./imgs/actionButtons/save.png" alt="Save btn" className="save-action action-btn" />
                    </button>
                    {/* <button className="openShared" onClick={openOpenShare}>
                    Open Shared
                </button> */}
                </div>
            </div>

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
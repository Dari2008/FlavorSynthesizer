import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import SynthLine from "./SynthLine";
import { SynthLinesContext } from "../../contexts/SynthLinesContext";
import { calculateCurrentPosSeconds, constrainSpan, convertScreenXToTimeline, getOffsetX, getPixelsPerSecond, setPixelsPerSecond, setSpan } from "../FlavorUtils";
import type { FlavorElement } from "./PlayerTrack";
import { SynthSelectorContext } from "./SynthSelectorContext";
import { ElementPlayer } from "./ElementPlayer";
import { CurrentlyPlayingContext } from "./CurrentlyPlayingContext";
import * as Tone from "tone";


type EventListWithUUID<T> = {
    [uuid: string]: T;
};

export default function FlavorSynth() {
    const [synthLines, setSynthLines] = useState<FlavorSynthLine[]>([]);
    const widthRef = useRef<number>(window.innerWidth - 300);
    const currentSpanRef = useRef<CurrentSpan>({ from: 0, to: 60 });
    const currentZoomRef = useRef<number>(1);
    const focusedSynthRef = useRef<string | null>(null);
    const selectedElementsRef = useRef<{ uuid: string }[]>([]);
    const playerRef = useRef<ElementPlayer>(new ElementPlayer());
    const [isPlaying, setPlaying] = useState<boolean>(false);
    const isPlayingRef = useRef<boolean>(false);
    const currentPositionRef = useRef<number>(0);
    const currentPlayingOffsetRef = useRef<number>(0);
    const currentFrameId = useRef<number>(-1);

    const synthSelectionChangeCallbacks = useRef<EventListWithUUID<() => void>>({});
    const synthRepaintCallbacks = useRef<EventListWithUUID<() => void>>({});
    const collisionCheckerCallbacks = useRef<EventListWithUUID<(fromOffset: number, toOffset: number) => boolean>>({});
    const onElementMoveCallbacks = useRef<EventListWithUUID<(secondsOffset: number) => void>>({});
    const resizeCallbacks = useRef<EventListWithUUID<(fromOffset: number, toOffset: number) => void>>({});


    window.onresize = () => {
        widthRef.current = window.innerWidth - 300;
    };

    playerRef.current.onStop = () => {
        setPlaying(false);
        isPlayingRef.current = false;
    };

    const addSynth = () => {
        const uuid = crypto.randomUUID();
        const synthLine: FlavorSynthLine = {
            uuid: uuid,
            elements: []
        };
        synthLines.push(synthLine)
        setSynthLines([...synthLines]);
    };

    const deleteSynth = (uuid: string) => {
        setSynthLines([...synthLines.filter(e => e.uuid !== uuid)]);
    }

    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.ctrlKey) {
            const zoomFactor = 1 + (e.deltaY * 0.001);

            let newSpanWidth = (currentSpanRef.current.to - currentSpanRef.current.from) * zoomFactor;
            if (newSpanWidth < 10) return;
            if (newSpanWidth > 300) return;

            const zoomInOnSecond = calculateCurrentPosSeconds(e.clientX);
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

        } else {
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
        }
        // Object.values(synthRepaintCallbacks).forEach(cb => cb());
    };

    setSpan(widthRef.current, currentSpanRef.current);


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
        const elements = synthLines.flatMap(line => line.elements.map(el => ({ ...el, lineUuid: line.uuid })));

        playerRef.current.stop();
        playerRef.current.loadElements(elements);
        playerRef.current.play();
        setPlaying(true);
        isPlayingRef.current = true;
        currentPlayingOffsetRef.current = Tone.now();
    };

    const stop = () => {
        playerRef.current.stop();
        setPlaying(false);
        isPlayingRef.current = false;
    }

    const currentPlayChanged = () => {
        currentPositionRef.current = Tone.now() - currentPlayingOffsetRef.current;
        if (!isPlaying) return;
        repaintAll();
    };

    const clock = new Tone.Clock(() => {
        currentPlayChanged();
    }, 100)
    clock.start();




    return <>
        <SynthLinesContext.Provider value={{
            synthLines,
            setSynthLines,
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
            canOffsetAll
        }}>
            <SynthSelectorContext.Provider value={{ setSelectedSynthLine, focusedSynthRef, selectedElementsRef, addSynthSelectionChange }}>
                <CurrentlyPlayingContext.Provider value={{ isPlayingRef, currentPositionRef }}>
                    <div className="flavor-synth">
                        <div className="lines">
                            {
                                Object.values(synthLines).map(e => <SynthLine key={e.uuid} flavorSynthLine={e} widthRef={widthRef} currentScrolledRef={currentSpanRef}></SynthLine>)
                            }
                        </div>
                    </div>
                </CurrentlyPlayingContext.Provider>
            </SynthSelectorContext.Provider>
        </SynthLinesContext.Provider>
        <div className="flavor-synth-controls">
            <button className="addLine" onClick={() => addSynth()}>+</button>
            <button className="play" onClick={() => { isPlaying ? stop() : play(); }}>{isPlaying ? "Stop" : "Play"}</button>
        </div>

    </>
}

export type FlavorSynthLine = {
    uuid: string;
    elements: FlavorElement[];
}

export type CurrentSpan = {
    from: number;
    to: number;
}
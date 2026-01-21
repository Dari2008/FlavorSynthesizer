import { createContext, useContext, useRef, useState, type ReactNode } from "react"
import SynthLine from "./SynthLine";
import { SynthLinesContext } from "../../contexts/SynthLinesContext";
import { calculateCurrentPosSeconds, constrainSpan, convertScreenXToTimeline, getOffsetX, getPixelsPerSecond, setPixelsPerSecond, setSpan } from "../FlavorUtils";
import type { FlavorElement } from "./PlayerTrack";
import { SynthSelectorContext } from "./SynthSelectorContext";


type EventListWithUUID<T> = {
    [uuid: string]: T;
};

export default function FlavorSynth() {
    const [synthLines, setSynthLines] = useState<FlavorSynthLine[]>([]);
    const [width, setWidth] = useState(window.innerWidth - 300);
    const currentSpanRef = useRef<CurrentSpan>({ from: 0, to: 60 });
    const currentZoomRef = useRef<number>(1);
    const focusedSynthRef = useRef<string | null>(null);
    const selectedElementsRef = useRef<{ uuid: string }[]>([]);
    let synthSelectionChangeCallbacks: EventListWithUUID<() => void> = {};
    let synthRepaintCallbacks: EventListWithUUID<() => void> = {};
    let collisionCheckerCallbacks: EventListWithUUID<((fromOffset: number, toOffset: number) => boolean)> = {};
    let onElementMoveCallbacks: EventListWithUUID<((secondsOffset: number) => void)> = {};
    let resizeCallbacks: EventListWithUUID<((fromOffset: number, toOffset: number) => void)> = {};

    window.onresize = () => {
        setWidth(window.innerWidth - 300);
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

            setSpan(width, currentSpanRef.current);

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
            setSpan(width, currentSpanRef.current);
        }
        Object.values(synthRepaintCallbacks).forEach(cb => cb());
    };

    setSpan(width, currentSpanRef.current);


    const setSelectedSynthLine = (uuid: string | null) => {
        focusedSynthRef.current = uuid;
        Object.values(synthSelectionChangeCallbacks).forEach(cb => cb());
    }

    const addSynthSelectionChange = (uuid: string, cb: () => void) => {
        synthSelectionChangeCallbacks[uuid] = cb;
    }

    const addSynthRepainter = (uuid: string, sr: () => void) => {
        synthRepaintCallbacks[uuid] = sr;
    };

    const repaintAll = () => {
        Object.values(synthRepaintCallbacks).forEach(cb => cb());
    };

    const deleteSelectedElements = () => {
        const selectedUUIDs = selectedElementsRef.current.map(e => e.uuid);
        synthLines.forEach(synthLine => {
            synthLine.elements = synthLine.elements.filter(el => selectedUUIDs.indexOf(el.uuid) == -1);
        });
        setSynthLines([...synthLines]);
    };

    const addCollisionCheckerCallback = (uuid: string, cb: (fromOffset: number, toOffset: number) => boolean) => {
        collisionCheckerCallbacks[uuid] = cb;
    };

    const addOnElementMove = (uuid: string, cb: (secondsOffset: number) => void) => {
        onElementMoveCallbacks[uuid] = cb;
    };

    const addOnElementResize = (uuid: string, cb: (fromOffset: number, toOffset: number) => void) => {
        resizeCallbacks[uuid] = cb;
    }

    const moveAll = (secondsOffset: number) => {
        console.log(onElementMoveCallbacks);
        Object.values(onElementMoveCallbacks).forEach(cb => cb(secondsOffset));
    };

    const resizeAll = (fromOffset: number, toOffset: number) => {
        Object.values(resizeCallbacks).forEach(cb => cb(fromOffset, toOffset));
    };


    const canOffsetAll = (fromOffset: number, toOffset: number): boolean => {
        for (const cb of Object.values(collisionCheckerCallbacks)) {
            if (!cb(fromOffset, toOffset)) return false;
        }
        return true;
    };


    return <SynthLinesContext.Provider value={{
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
            <div className="flavor-synth">
                <button className="addLine" onClick={() => addSynth()}>+</button>
                <div className="lines">
                    {
                        Object.values(synthLines).map(e => <SynthLine key={e.uuid} flavorSynthLine={e} width={width} currentScrolledRef={currentSpanRef}></SynthLine>)
                    }
                </div>
            </div>
        </SynthSelectorContext.Provider>
    </SynthLinesContext.Provider>
}

export type FlavorSynthLine = {
    uuid: string;
    elements: FlavorElement[];
}

export type CurrentSpan = {
    from: number;
    to: number;
}
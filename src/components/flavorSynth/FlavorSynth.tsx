import { createContext, useContext, useRef, useState, type ReactNode } from "react"
import SynthLine from "./SynthLine";
import { SynthLinesContext } from "../../contexts/SynthLinesContext";
import { calculateCurrentPosSeconds, constrainSpan, convertScreenXToTimeline, getOffsetX, getPixelsPerSecond, setPixelsPerSecond, setSpan } from "../FlavorUtils";
import type { FlavorElement } from "./PlayerTrack";


export default function FlavorSynth() {
    const [synthLines, setSynthLines] = useState<FlavorSynthLine[]>([]);
    const [width, setWidth] = useState(window.innerWidth - 300);
    const currentSpanRef = useRef<CurrentSpan>({ from: 0, to: 60 });
    const currentZoomRef = useRef<number>(1);

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
    };

    setSpan(width, currentSpanRef.current);

    return <SynthLinesContext.Provider value={{ synthLines: synthLines, setSynthLines: setSynthLines, delete: deleteSynth, onWheel }}>
        <div className="flavor-synth">
            <button className="addLine" onClick={() => addSynth()}>+</button>
            <div className="lines">
                {
                    Object.values(synthLines).map(e => <SynthLine key={e.uuid} flavorSynthLine={e} width={width} currentScrolledRef={currentSpanRef}></SynthLine>)
                }
            </div>
        </div>
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
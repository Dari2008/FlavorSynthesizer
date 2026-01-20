import { createContext, useContext, useRef, useState, type ReactNode } from "react"
import SynthLine from "./SynthLine";
import { SynthLinesContext } from "../../contexts/SynthLinesContext";


export default function FlavorSynth() {
    const [synthLines, setSynthLines] = useState<FlavorSynthLine[]>([]);
    const [width, setWidth] = useState(window.innerWidth - 300);
    const currentSpanRef = useRef<CurrentSpan>({ from: 0, to: 60 });

    const addSynth = () => {
        const uuid = crypto.randomUUID();
        const synthLine: FlavorSynthLine = {
            uuid: uuid
        };
        synthLines.push(synthLine)
        setSynthLines([...synthLines]);
    };

    const deleteSynth = (uuid: string) => {
        setSynthLines([...synthLines.filter(e => e.uuid !== uuid)]);
    }

    const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        const offsetSeconds = e.deltaY * 0.003;
        if (currentSpanRef.current.from + offsetSeconds < 0) {
            const dist = currentSpanRef.current.to - currentSpanRef.current.from;
            currentSpanRef.current.from = 0;
            currentSpanRef.current.to = Math.round(Math.abs(dist));
        } else {
            currentSpanRef.current.from += offsetSeconds;
            currentSpanRef.current.to += offsetSeconds;
        }
    };

    return <SynthLinesContext.Provider value={{ synthLines: synthLines, setSynthLines: setSynthLines, delete: deleteSynth, onWheel }}>
        <div className="flavor-synth" >
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
}

export type CurrentSpan = {
    from: number;
    to: number;
}
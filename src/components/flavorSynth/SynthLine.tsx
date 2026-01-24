import { useRef, useState } from "react";
import "./SynthLine.scss";
import PlayerTrack from "./PlayerTrack";
import { type CurrentSpan, type FlavorSynthLine } from "./FlavorSynth";
import { useSynthLines } from "../../contexts/SynthLinesContext";
import { TooltipContext } from "./TooltipContext";

export default function SynthLine({ widthRef, flavorSynthLine, currentScrolledRef }: { widthRef: React.RefObject<number>, flavorSynthLine: FlavorSynthLine, currentScrolledRef: React.RefObject<CurrentSpan> }) {
    const tooltipRef = useRef<HTMLParagraphElement>(null);
    const [isMuted, setMuted] = useState<boolean>(false);
    const synthLines = useSynthLines();


    return <TooltipContext.Provider value={tooltipRef}>
        <div className="synth-line-controls"  >
            <button className="delete" onClick={() => synthLines.delete(flavorSynthLine.uuid)}>x</button>
            <button className="mute" onClick={() => setMuted(!isMuted)}>{!isMuted ? "\uf028" : "\uf6a9"}</button>
        </div>
        <div className="line" {...{ "data-muted": isMuted ? "" : undefined }}>
            <div className="playerTrack">
                <p className="tooltip" ref={tooltipRef}></p>
                <PlayerTrack widthRef={widthRef} currentScrolledRef={currentScrolledRef} flavorSynthLine={flavorSynthLine}></PlayerTrack>
            </div>
        </div>
    </TooltipContext.Provider>
}
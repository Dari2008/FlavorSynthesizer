import { useState } from "react";
import "./SynthLine.scss";
import PlayerTrack from "./PlayerTrack";
import { type CurrentSpan, type FlavorSynthLine } from "./FlavorSynth";
import { useSynthLines } from "../../contexts/SynthLinesContext";

export default function SynthLine({ width, flavorSynthLine, currentScrolledRef }: { width: number; flavorSynthLine: FlavorSynthLine, currentScrolledRef: React.RefObject<CurrentSpan> }) {
    const [isMuted, setMuted] = useState<boolean>(false);
    const synthLines = useSynthLines();

    return <div {...{ "data-muted": isMuted ? "" : undefined }} className="line">
        <button className="delete" onClick={() => synthLines.delete(flavorSynthLine.uuid)}>x</button>
        <button className="mute" onClick={() => setMuted(!isMuted)}>{!isMuted ? "\uf028" : "\uf6a9"}</button>
        <div className="playerTrack">
            <PlayerTrack width={width} currentScrolledRef={currentScrolledRef}></PlayerTrack>
        </div>
    </div>
}
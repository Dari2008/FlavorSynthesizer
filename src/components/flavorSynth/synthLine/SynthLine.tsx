import { useRef, useState } from "react";
import "./SynthLine.scss";
import { useSynthLines } from "../../../contexts/SynthLinesContext";
import { TooltipContext } from "../../../contexts/TooltipContext";
import PlayerTrack from "../PlayerTrack";
import type { CurrentSpan, FlavorSynthLine } from "../FlavorSynth";

export default function SynthLine({ widthRef, flavorSynthLine, currentScrolledRef }: { widthRef: React.RefObject<number>, flavorSynthLine: FlavorSynthLine, currentScrolledRef: React.RefObject<CurrentSpan> }) {
    const synthLines = useSynthLines();

    const [isMuted, setM] = useState<boolean>(false);
    const tooltipRef = useRef<HTMLParagraphElement>(null);
    const volumeRef = useRef<HTMLInputElement>(null);
    const [isSolo, setS] = useState<boolean>(false);

    const setSolo = (s: boolean) => {
        if (isSolo != s) setS(s);
        flavorSynthLine.solo = s;
    };

    const setMuted = (mute: boolean) => {
        flavorSynthLine.muted = mute;
        if (volumeRef.current) volumeRef.current.value = (mute ? 0 : flavorSynthLine.volume) + "";
        if (isMuted != mute) setM(mute);
    };

    const volumeChanged = () => {
        const vol = parseFloat(volumeRef.current?.value || "0");
        if (vol <= 0) {
            if (!isMuted) setM(true);
            flavorSynthLine.muted = true;
        } else {
            if (isMuted) setM(false);
            flavorSynthLine.volume = vol;
        }
    }

    const deleteSynth = () => {
        const deleteS = confirm("Do you want to delete this Synth Line?");
        if (!deleteS) return;
        synthLines.delete(flavorSynthLine.uuid);
    };

    return <TooltipContext.Provider value={tooltipRef}>
        <div className="synth-line-controls"  >
            <button className="delete" onClick={() => deleteSynth()}>x</button>
            <button className="mute" onClick={() => setMuted(!isMuted)} {...{ "data-muted": isMuted ? "" : undefined }}>{!isMuted ? "\uf028" : "\uf6a9"}</button>
            <button className="solo" onClick={() => setSolo(!isSolo)} {...{ "data-solo": isSolo ? "" : undefined }}>{isSolo ? "\uf025" : "\ue77c"}</button>
            <input type="range" name="volume" className="volume" min={0} max={1} step={0.01} onChange={volumeChanged} ref={(ref) => { volumeRef.current = ref; if (ref) ref.value = flavorSynthLine.volume + "" }} />
        </div>
        <div className="line" {...{ "data-muted": isMuted ? "" : undefined }}>
            <div className="playerTrack">
                <p className="tooltip" ref={tooltipRef}></p>
                <PlayerTrack widthRef={widthRef} currentScrolledRef={currentScrolledRef} flavorSynthLine={flavorSynthLine}></PlayerTrack>
            </div>
        </div>
    </TooltipContext.Provider>
}
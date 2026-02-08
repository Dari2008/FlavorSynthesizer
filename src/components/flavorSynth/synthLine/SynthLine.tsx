import { useRef, useState } from "react";
import "./SynthLine.scss";
import { useSynthLines } from "../../../contexts/SynthLinesContext";
import { TooltipContext } from "../../../contexts/TooltipContext";
import PlayerTrack from "../PlayerTrack";
import type { CurrentSpan, FlavorSynthLine } from "../FlavorSynth";
import { useCurrentDish } from "../../../contexts/CurrentDish";
import useJsObjectHook from "../../../hooks/JsObjectHook";
import { useSynthChange } from "../../../contexts/SynthChangeContext";
import { useCurrentDishActions } from "../../../contexts/DishActions";

export default function SynthLine({ widthRef, synthLineUUID, currentScrolledRef }: { widthRef: React.RefObject<number>, synthLineUUID: string, currentScrolledRef: React.RefObject<CurrentSpan> }) {
    const synthLines = useSynthLines();

    const tooltipRef = useRef<HTMLParagraphElement>(null);
    const volumeRef = useRef<HTMLInputElement>(null);

    const currentDish = useCurrentDish();
    const change = useSynthChange();
    const dishActions = useCurrentDishActions();

    const flavorSynthLine = (currentDish?.data ?? []).filter(e => e.uuid == synthLineUUID).at(0);

    // const [isMuted, setMuted] = dishActions.muted;

    const [isMuted, setMuted] = useJsObjectHook<boolean, FlavorSynthLine>(false, flavorSynthLine, "muted", (e) => { change.changed(); return e; });
    const [isSolo, setSolo] = useJsObjectHook<boolean, FlavorSynthLine>(false, flavorSynthLine, "solo", (e) => { change.changed(); return e; });
    // const setSolo = (s: boolean) => {
    //     if (isSolo != s) setS(s);
    //     flavorSynthLine.solo = s;
    // };

    // const setMuted = (mute: boolean) => {
    //     flavorSynthLine.muted = mute;
    //     if (volumeRef.current) volumeRef.current.value = (mute ? 0 : flavorSynthLine.volume) + "";
    //     if (isMuted != mute) setM(mute);
    // };

    const volumeChanged = () => {
        if (!flavorSynthLine) return;
        const vol = parseFloat(volumeRef.current?.value || "0");
        if (vol <= 0) {
            if (!isMuted) setMuted(true);
        } else {
            if (isMuted) setMuted(false);
            flavorSynthLine.volume = vol;
            change.changed();
        }
    }

    const deleteSynth = () => {
        if (!flavorSynthLine) return;
        const deleteS = confirm("Do you want to delete this Synth Line?");
        if (!deleteS) return;
        synthLines.delete(flavorSynthLine.uuid);
        change.changed();
    };

    return <TooltipContext.Provider value={tooltipRef}>
        <div className="synth-line-controls"  >
            <button className="delete" onClick={() => deleteSynth()}>x</button>
            <button className="mute" onClick={() => setMuted(!isMuted)} {...{ "data-muted": isMuted ? "" : undefined }}>{!isMuted ? "\uf028" : "\uf6a9"}</button>
            <button className="solo" onClick={() => setSolo(!isSolo)} {...{ "data-solo": isSolo ? "" : undefined }}>{isSolo ? "\uf025" : "\ue77c"}</button>
            <input type="range" name="volume" className="volume" min={0} max={1} step={0.01} onChange={volumeChanged} ref={(ref) => { volumeRef.current = ref; if (ref) ref.value = (flavorSynthLine?.volume ?? 0) + "" }} />
        </div>
        <div className="line" {...{ "data-muted": isMuted ? "" : undefined }}>
            <div className="playerTrack">
                <p className="tooltip" ref={tooltipRef}></p>
                <PlayerTrack widthRef={widthRef} currentScrolledRef={currentScrolledRef} synthLineUUID={synthLineUUID}></PlayerTrack>
            </div>
        </div>
    </TooltipContext.Provider>
}
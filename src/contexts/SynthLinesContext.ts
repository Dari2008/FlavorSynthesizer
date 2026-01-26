import { createContext, useContext } from "react";
import type { FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";

type SynthLines = {
    synthLines: FlavorSynthLine[];
    setSynthLines: (synthLines: FlavorSynthLine[]) => void;
    delete: (uuid: string) => void;
    onWheel: (e: WheelEvent) => void;
    addSynthRepainter: (uuid: string, sr: () => void) => void;
    addCurrentPositionRepainter: (uuid: string, sr: () => void) => void;
    repaintAll: () => void;
    deleteSelectedElements: () => void;
    addCollisionCheckerCallback: (uuid: string, cb: (fromOffset: number, toOffset: number) => boolean) => void;
    addOnElementMove: (uuid: string, cb: (secondsOffset: number) => void) => void;
    addOnElementResize: (uuid: string, cb: (fromOffset: number, toOffset: number) => void) => void;
    moveAll: (secondsOffset: number) => void;
    resizeAll: (fromOffset: number, toOffset: number) => void;
    canOffsetAll: (fromOffset: number, toOffset: number) => boolean;
    addTimelineRepainter: (uuid: string, sr: () => void) => void;
    addElementsRepainter: (uuid: string, sr: () => void) => void;
    deleteElement: (uuid: string) => void;
    repaintAllTimelines: () => void;
    repaintAllElements: () => void;
}

export const SynthLinesContext = createContext<SynthLines>(undefined as any);

export function useSynthLines(): SynthLines {
    const ctx = useContext(SynthLinesContext);
    if (!ctx) {
        throw ("Cant Use useSynthLines outside of context");
    }
    return ctx as SynthLines;
}
import { createContext, useContext } from "react";
import type { FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";

type SynthLines = {
    synthLines: FlavorSynthLine[];
    setSynthLines: (synthLines: FlavorSynthLine[]) => void;
    delete: (uuid: string) => void;
    onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
}

export const SynthLinesContext = createContext<SynthLines>(undefined as any);

export function useSynthLines(): SynthLines {
    const ctx = useContext(SynthLinesContext);
    if (!ctx) {
        throw ("Cant Use useSynthLines outside of context");
    }
    return ctx as SynthLines;
}
import { createContext, useContext } from "react"

export type SynthChangeContextType = {
    changed: () => void;
    saveFlavorSynth: () => void;
}

export const SynthChangeContext = createContext<SynthChangeContextType | null>(null);

export function useSynthChange() {
    const ctx = useContext<SynthChangeContextType | null>(SynthChangeContext);
    if (!ctx) {
        throw ("Cant use synth change ouside of provider");
    }
    return ctx;
}
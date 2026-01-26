import { createContext, useContext } from "react";

type SynthSelector = {
    setSelectedSynthLine: (uuid: string | null) => void;
    addSynthSelectionChange: (uuid: string, cb: () => void) => void;
    focusedSynthRef: React.RefObject<string | null>;
    selectedElementsRef: React.RefObject<{ uuid: string }[]>;
}

export const SynthSelectorContext = createContext<SynthSelector | null>(null);

export function useSynthSelector(): SynthSelector {
    const ctx = useContext(SynthSelectorContext);
    if (!ctx) {
        throw ("Cant Use useSynthSelector outside of context");
    }
    return ctx as SynthSelector;
}
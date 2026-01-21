import { createContext, useContext } from "react";

type SynthSelector = {
    setSelectedSynthLine: (uuid: string | null) => void;
    addSynthSelectionChange: (cb: () => void) => void;
    focusedSynthRef: React.RefObject<string | null>;
}

export const SynthSelectorContext = createContext<SynthSelector | null>(null);

export function useSynthSelector(): SynthSelector {
    const ctx = useContext(SynthSelectorContext);
    if (!ctx) {
        throw ("Cant Use useSynthSelector outside of context");
    }
    return ctx as SynthSelector;
}
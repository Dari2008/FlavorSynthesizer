import { createContext, useContext } from "react";
import type { FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";
import type { Volumes } from "./VolumeContext";

export type CurrentDishactionsContextType = {
    synthLines: [FlavorSynthLine[], (vs: FlavorSynthLine[]) => void, (v: FlavorSynthLine) => void];
    volumes: [React.RefObject<Volumes>, (v: Volumes) => void];
}

export const CurrentDishActionsContext = createContext<CurrentDishactionsContextType | null>(null);


export function useCurrentDishActions() {
    const ctx = useContext<CurrentDishactionsContextType | null>(CurrentDishActionsContext);
    if (!ctx) {
        throw ("Cant use current dish actions outside of provider");
    }
    return ctx;
}
import { createContext, useContext } from "react";
import type { FlavorSynthLine } from "../components/flavorSynth/FlavorSynth";
import type { DishVolumes } from "../@types/User";

export type CurrentDishactionsContextType = {
    synthLines: [FlavorSynthLine[], React.Dispatch<React.SetStateAction<FlavorSynthLine[]>>];
    volumes: [React.RefObject<DishVolumes>, (f: ((v: DishVolumes) => DishVolumes) | DishVolumes) => void];
}

export const CurrentDishActionsContext = createContext<CurrentDishactionsContextType | null>(null);


export function useCurrentDishActions() {
    const ctx = useContext<CurrentDishactionsContextType | null>(CurrentDishActionsContext);
    if (!ctx) {
        throw ("Cant use current dish actions outside of provider");
    }
    return ctx;
}
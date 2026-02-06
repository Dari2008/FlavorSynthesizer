import { createContext, useContext } from "react";
import type { MainFlavor } from "../@types/Flavors"

type MainFlavorContextType = {
    mainFlavor: MainFlavor;
    setMainFlavor: (main: MainFlavor) => void;
}

export const MainFlavorContext = createContext<MainFlavorContextType | null>(null);

export function useMainFlavor() {
    const ctx = useContext<MainFlavorContextType | null>(MainFlavorContext);
    if (!ctx) {
        throw ("Cant use main flavor outside of provider");
    }
    return ctx;
}
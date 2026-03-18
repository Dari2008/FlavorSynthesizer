import { createContext, useContext } from "react";
import type { CustomFlavor } from "../components/addCustomFlavor/CustomFlavorManager";
import type { CustomFlavorMusic } from "../audio/FlavorMusic";

export type CustomFlavorsType = {
    customFlavors: CustomFlavor[];
    musicPlayers: CustomFlavorMusic[];
    setCustomFlavors: (v: ((s: CustomFlavor[]) => CustomFlavor[]) | CustomFlavor[]) => void;
    listContainsCustomFlavors: boolean;
    setListContainsCustomFlavors: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CustomFlavors = createContext<CustomFlavorsType | null>(null);

export function useCustomFlavors() {
    const ctx = useContext<CustomFlavorsType | null>(CustomFlavors);
    if (!ctx) throw ("Cant use custom flavors outside of provider");
    return ctx;
}
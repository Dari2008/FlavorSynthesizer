import { createContext, useContext } from "react";

type Pos = {
    x: number;
    y: number;
};

type FlavorSynthContextMenuType = {
    openContextMenu: (pos: Pos) => void;
};

export const FlavorSynthContextMenu = createContext<FlavorSynthContextMenuType | null>(null);


export function useFlavorSynthContextMenu() {
    const ctx = useContext<FlavorSynthContextMenuType | null>(FlavorSynthContextMenu);
    if (!ctx) throw ("Cant use context out of provider (FlavorSynthContextMenu)");
    return ctx;
}
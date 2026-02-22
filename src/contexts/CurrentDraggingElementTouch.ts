import React, { createContext, useContext } from "react";
import type { Flavor } from "../@types/Flavors";

type CurrentDraggingElementTouchType = {
    currentDraggingElement: React.RefObject<Flavor | null>;
}

export const CurrentDraggingElementTouch = createContext<CurrentDraggingElementTouchType | null>(null);

export function useCurrentDraggingElement() {
    const ctx = useContext<CurrentDraggingElementTouchType | null>(CurrentDraggingElementTouch);
    if (!ctx) {
        throw ("Cant use current dragging element outside of context");
    }
    return ctx;
}
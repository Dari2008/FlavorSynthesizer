import React, { createContext, useContext } from "react";
import type { FlavorElement } from "../components/flavorSynth/PlayerTrack";
import type { UUID } from "../@types/User";

type InterPlayerDragContext = {
    ref: React.RefObject<UUID | null>;
    originalStartPos: React.RefObject<[number, number] | null>;
    offsetLeft: React.RefObject<number>;
    onPlaced: React.RefObject<(() => void)>;
    isEmptyRef: React.RefObject<(element: FlavorElement | null, from: number, to?: number) => boolean>;
    originSynthLine: React.RefObject<UUID | null>;
};

export const CurrentInterPlayerDragContext = createContext<InterPlayerDragContext | null>(null);

export function useInterPlayerDrag() {
    const ctx = useContext<InterPlayerDragContext | null>(CurrentInterPlayerDragContext);
    if (!ctx) {
        throw ("Cant use useInterPlayerDrag outside of CurrentInterPlayerDragContext.Provider");
    }

    return ctx;
}
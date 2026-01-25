import { createContext, useContext } from "react";

type CurrentlyPlayingContextType = {
    isPlayingRef: React.RefObject<boolean>;
    isSoloPlay: React.RefObject<boolean>;
    currentPositionRef: React.RefObject<number>;
}

export const CurrentlyPlayingContext = createContext<CurrentlyPlayingContextType | null>(null);

export function useCurrentlyPlaying() {
    const context = useContext(CurrentlyPlayingContext);
    if (!context) {
        throw new Error("useCurrentlyPlaying must be used within a CurrentlyPlayingContext");
    }
    return context;
}
import { createContext, useContext } from "react";

type GameStateContextType = {
    gameState: GameState;
    setGameState: (state: GameState) => void;
    goBack: () => void;
    createNewActiveDish: () => void;
};

export const GameStateContext = createContext<GameStateContextType | null>(null);

export function useGameState() {
    const ctx = useContext<GameStateContextType | null>(GameStateContext);
    if (!ctx) {
        throw ("Cant use useGameState outside of Provider");
    }
    return ctx;
}

export type GameState = "mainMenu" | "dishList" | "openShared" | "createDish-mainFlavor" | "createDish-create" | "createDish-create-viewonly" | "createDish-share";
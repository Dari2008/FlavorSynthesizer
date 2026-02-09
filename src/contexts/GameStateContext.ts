import { createContext, useContext } from "react";
import type { Dish, LocalDish } from "../@types/User";

type GameStateContextType = {
    gameState: GameState;
    setGameState: (state: GameState) => void;
    goBack: () => void;
    createNewActiveDish: (newDish?: Dish | LocalDish, setCurrent?: boolean, indexToInsertAt?: number) => void;
};

export const GameStateContext = createContext<GameStateContextType | null>(null);

export function useGameState() {
    const ctx = useContext<GameStateContextType | null>(GameStateContext);
    if (!ctx) {
        throw ("Cant use useGameState outside of Provider");
    }
    return ctx;
}

export type GameState = "loading" | "mainMenu" | "dishList" | "openShared" | "createDish-mainFlavor" | "createDish-create" | "createDish-create-viewonly" | "createDish-share";
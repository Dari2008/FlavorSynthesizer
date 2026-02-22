import { createContext, useContext } from "react";

type TouchCheckerContextType = {
    isTouch: boolean;
};

export const TouchCheckerContext = createContext<TouchCheckerContextType | null>(null);

export function useTouchChecker() {
    const ctx = useContext<TouchCheckerContextType | null>(TouchCheckerContext);
    if (!ctx) {
        throw ("Cant use touch checker outside of context");
    }
    return ctx;
}
import { createContext, useContext } from "react";

type TutorialProgressContextType = {
    next: () => void;
    prev: () => void;
    finish: () => void;
    skip: () => void;
    isFinished: boolean;
    currentStep: number;
    maxSteps: number;
    title: string;
}

export const TutorialProgressContext = createContext<TutorialProgressContextType | null>(null);


export function useTutorialProgress() {
    const ctx = useContext<TutorialProgressContextType | null>(TutorialProgressContext);
    if (!ctx) {
        throw ("useTutorials can't be used outisde if context provider");
    }
    return ctx;
}
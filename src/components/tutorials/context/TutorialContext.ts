import { createContext, useContext } from "react";
import type { TutorialAction } from "../Tutorials";

type TutorialContextType = {
    startTutorial: (tutorial: TutorialAction) => void;
    onAction: (action: TutorialAction) => void;
    isTutorialFinished: (tutorial: TutorialAction) => boolean;
    finishedTutorial: () => void;
}

export const TutorialContext = createContext<TutorialContextType | null>(null);


export function useTutorials() {
    const ctx = useContext<TutorialContextType | null>(TutorialContext);
    if (!ctx) {
        throw ("useTutorials can't be used outisde if context provider");
    }
    return ctx;
}
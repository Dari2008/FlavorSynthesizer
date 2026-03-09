import { useState } from "react";

export function useTutorialSteps<T>(steps: T[], finish: () => void) {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const isFinished = currentStep >= steps.length - 1;

    const next = () => {
        setCurrentStep(currentStep => {
            if (currentStep + 1 >= steps.length - 1) return steps.length - 1;
            return currentStep + 1;
        });
    };

    const prev = () => {
        setCurrentStep(currentStep => {
            if (currentStep - 1 < 0) return 0;
            return currentStep - 1;
        });
    };


    const currentData = {
        currentStep,
        steps: steps,
        step: steps[currentStep],
        isFinished,
        next,
        prev,
        finish,
        maxSteps: steps.length
    };

    return currentData;
}
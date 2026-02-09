import { createContext, useContext } from "react";

export type LoadingAnimationContextType = {
    startLoading: (key?: string) => void;
    stopLoading: (key?: string) => void;
}

export const LoadingAnimationContext = createContext<LoadingAnimationContextType | null>(null);

export function useLoadingAnimation() {
    const ctx = useContext<LoadingAnimationContextType | null>(LoadingAnimationContext);
    if (!ctx) {
        throw ("Cant use animation outside of provider");
    }
    return {
        withKey: (key?: string) => {
            return {
                startLoading: () => {
                    ctx.startLoading(key);
                },
                stopLoading: () => {
                    ctx.stopLoading(key);
                }
            }
        },
        ...ctx
    };
}
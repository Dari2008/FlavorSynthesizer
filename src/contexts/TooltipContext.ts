import { createContext, useContext } from "react";


export const TooltipContext = createContext<React.RefObject<HTMLParagraphElement | null> | null>(null);

export function useTooltip(): React.RefObject<HTMLParagraphElement | null> {
    const ctx = useContext(TooltipContext);
    if (!ctx) {
        throw ("Cant Use useTooltip outside of context");
    }
    return ctx as React.RefObject<HTMLParagraphElement | null>;
}
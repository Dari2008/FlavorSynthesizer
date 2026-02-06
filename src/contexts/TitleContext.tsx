import { createContext, useContext, type ReactNode } from "react";


export type TitleManagerContextType = {
    setTitle: (title: string) => void;
    title: string;
}

export const TitleContext = createContext<TitleManagerContextType | undefined>(undefined);

export function useTitle() {
    const ctx = useContext(TitleContext);
    if (!ctx) {
        throw new Error("useLoadingAnimation must be used inside LoadingAnimationProvider");
    }
    return ctx as TitleManagerContextType;
};

export function TitleManager({ children }: { children: ReactNode }) {
    const setTitle = (title: string) => {
        document.title = title;
    }

    return <TitleContext.Provider value={{ setTitle, title: document.title }}>{children}</TitleContext.Provider>
}
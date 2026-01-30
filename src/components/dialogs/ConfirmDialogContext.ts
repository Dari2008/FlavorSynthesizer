import { createContext, useContext } from "react";

type ConfirmDialogType = {
    confirm: (text: string, type: ConfirmType) => Promise<boolean>;
}


export type ConfirmType = "noYes" | "cancelOk" | "cancelYes";

export const ConfirmDialogContext = createContext<ConfirmDialogType | null>(null);

export function useConfirm() {
    const ctx = useContext<ConfirmDialogType | null>(ConfirmDialogContext);
    if (!ctx) {
        throw ("Can use useConfirm only within context");
    }
    return ctx;
}
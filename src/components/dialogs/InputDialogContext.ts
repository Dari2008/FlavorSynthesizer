import { createContext, useContext } from "react";

type InputDialogType = {
    input: (text: string, type: AnswerType, inputType: React.HTMLInputTypeAttribute) => Promise<string | false>;
}


export type AnswerType = "noYes" | "cancelOk" | "cancelYes";

export const InputDialogContext = createContext<InputDialogType | null>(null);

export function useInput() {
    const ctx = useContext<InputDialogType | null>(InputDialogContext);
    if (!ctx) {
        throw ("Can use useInput only within context");
    }
    return ctx;
}